package main

import (
	"bufio"
	"context"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// FileNode represents a file or directory in the tree
type FileNode struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Path        string     `json:"path"`
	IsDirectory bool       `json:"isDirectory"`
	Children    []FileNode `json:"children,omitempty"`
	Size        int64      `json:"size,omitempty"`
}

// SearchResult represents a match in a markdown file
type SearchResult struct {
	Path       string `json:"path"`
	Name       string `json:"name"`
	LineNumber int    `json:"lineNumber"`
	Snippet    string `json:"snippet"`
}

// App struct
type App struct {
	ctx         context.Context
	configDir   string
	sessionFile string

	// Vault Watcher
	watcher       *fsnotify.Watcher
	watchMu       sync.Mutex
	watchStop     chan struct{}
	currentVault  string
	debounceMu    sync.Mutex
	debounceTimer *time.Timer

	// Search cancellation
	searchMu     sync.Mutex
	searchCancel context.CancelFunc
}

// NewApp creates a new App application struct
func NewApp() *App {
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = "."
	}
	tmarkdownDir := filepath.Join(configDir, "TMarkdown")
	_ = os.MkdirAll(tmarkdownDir, 0755)

	return &App{
		configDir:   tmarkdownDir,
		sessionFile: filepath.Join(tmarkdownDir, "session.json"),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// shutdown is called when the app closes
func (a *App) shutdown(ctx context.Context) {
	a.watchMu.Lock()
	defer a.watchMu.Unlock()
	a.stopWatcherInternal()
}

// StartWatcher starts or restarts a recursive fsnotify watcher on rootPath
func (a *App) StartWatcher(rootPath string) error {
	a.watchMu.Lock()
	defer a.watchMu.Unlock()

	if a.currentVault == rootPath && a.watcher != nil {
		return nil
	}

	a.stopWatcherInternal()

	if rootPath == "" {
		return nil
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	a.watcher = watcher
	a.watchStop = make(chan struct{})
	a.currentVault = rootPath

	// Recursively add directories to watcher
	_ = filepath.WalkDir(rootPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			name := d.Name()
			if strings.HasPrefix(name, ".") || name == "node_modules" {
				return filepath.SkipDir
			}
			_ = watcher.Add(path)
		}
		return nil
	})

	stopChan := a.watchStop

	go func() {
		for {
			select {
			case <-stopChan:
				return
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				base := filepath.Base(event.Name)
				if strings.HasPrefix(base, ".") || strings.Contains(event.Name, "node_modules") {
					continue
				}

				// If directory created, add to watcher
				if event.Op&fsnotify.Create == fsnotify.Create {
					if info, err := os.Stat(event.Name); err == nil && info.IsDir() {
						_ = watcher.Add(event.Name)
					}
				}

				// Debounce event notification
				a.debounceMu.Lock()
				if a.debounceTimer != nil {
					a.debounceTimer.Stop()
				}
				a.debounceTimer = time.AfterFunc(300*time.Millisecond, func() {
					if a.ctx != nil {
						rel, _ := filepath.Rel(rootPath, event.Name)
						normRel := filepath.ToSlash(rel)
						runtime.EventsEmit(a.ctx, "vault:file-changed", map[string]string{
							"path": normRel,
							"op":   event.Op.String(),
						})
					}
				})
				a.debounceMu.Unlock()

			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				_ = err
			}
		}
	}()

	return nil
}

func (a *App) stopWatcherInternal() {
	if a.watchStop != nil {
		close(a.watchStop)
		a.watchStop = nil
	}
	if a.watcher != nil {
		_ = a.watcher.Close()
		a.watcher = nil
	}
	a.currentVault = ""
}

// OpenFolderDialog opens a native Windows directory picker dialog
func (a *App) OpenFolderDialog() (string, error) {
	selectedDir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Chọn thư mục tài liệu Markdown (Vault)",
	})
	if err != nil {
		return "", err
	}
	return selectedDir, nil
}

// GetDirectoryTree recursively builds a file tree of markdown files
func (a *App) GetDirectoryTree(rootPath string) ([]FileNode, error) {
	if rootPath == "" {
		return nil, fmt.Errorf("root path is empty")
	}

	info, err := os.Stat(rootPath)
	if err != nil || !info.IsDir() {
		return nil, fmt.Errorf("path is not a valid directory: %s", rootPath)
	}

	// Auto-start file watcher in the background
	go func() {
		_ = a.StartWatcher(rootPath)
	}()

	return a.scanDirectory(rootPath, rootPath)
}

func (a *App) scanDirectory(currentPath string, rootPath string) ([]FileNode, error) {
	entries, err := os.ReadDir(currentPath)
	if err != nil {
		return nil, err
	}

	var nodes []FileNode

	for _, entry := range entries {
		name := entry.Name()

		// Skip hidden, git and node_modules
		if strings.HasPrefix(name, ".") || name == "node_modules" {
			continue
		}

		fullPath := filepath.Join(currentPath, name)
		relPath, _ := filepath.Rel(rootPath, fullPath)
		// normalize to forward slashes for cross-platform/web consistency
		normRelPath := filepath.ToSlash(relPath)

		if entry.IsDir() {
			children, err := a.scanDirectory(fullPath, rootPath)
			if err == nil {
				nodes = append(nodes, FileNode{
					ID:          normRelPath,
					Name:        name,
					Path:        normRelPath,
					IsDirectory: true,
					Children:    children,
				})
			}
		} else {
			// Only include markdown and text files
			ext := strings.ToLower(filepath.Ext(name))
			if ext == ".md" || ext == ".markdown" || ext == ".txt" {
				info, _ := entry.Info()
				var size int64
				if info != nil {
					size = info.Size()
				}
				nodes = append(nodes, FileNode{
					ID:          normRelPath,
					Name:        name,
					Path:        normRelPath,
					IsDirectory: false,
					Size:        size,
				})
			}
		}
	}

	// Sort: Directories first, then alphabetical
	sort.Slice(nodes, func(i, j int) bool {
		if nodes[i].IsDirectory && !nodes[j].IsDirectory {
			return true
		}
		if !nodes[i].IsDirectory && nodes[j].IsDirectory {
			return false
		}
		return strings.ToLower(nodes[i].Name) < strings.ToLower(nodes[j].Name)
	})

	return nodes, nil
}

// ReadFile reads the content of a file
func (a *App) ReadFile(rootPath string, relativePath string) (string, error) {
	cleanRel := strings.TrimPrefix(filepath.ToSlash(relativePath), "/")
	fullPath := filepath.Join(rootPath, filepath.FromSlash(cleanRel))
	data, err := os.ReadFile(fullPath)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// WriteFile writes the content to a file atomically
func (a *App) WriteFile(rootPath string, relativePath string, content string) error {
	cleanRel := strings.TrimPrefix(filepath.ToSlash(relativePath), "/")
	fullPath := filepath.Join(rootPath, filepath.FromSlash(cleanRel))
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	return os.WriteFile(fullPath, []byte(content), 0644)
}

// CreateNewFile creates a new markdown file safely
func (a *App) CreateNewFile(rootPath string, relativePath string, initialContent string) error {
	if rootPath == "" || relativePath == "" {
		return fmt.Errorf("rootPath và relativePath không được để trống")
	}
	cleanRel := strings.TrimPrefix(filepath.ToSlash(relativePath), "/")
	fullPath := filepath.Join(rootPath, filepath.FromSlash(cleanRel))

	if _, err := os.Stat(fullPath); err == nil {
		return fmt.Errorf("tệp tin đã tồn tại: %s", relativePath)
	}

	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	if initialContent == "" {
		baseName := strings.TrimSuffix(filepath.Base(cleanRel), filepath.Ext(cleanRel))
		initialContent = fmt.Sprintf("# %s\n\nBắt đầu ghi chú tại đây...\n", baseName)
	}

	return os.WriteFile(fullPath, []byte(initialContent), 0644)
}

// CreateNewDirectory creates a new directory inside the vault
func (a *App) CreateNewDirectory(rootPath string, relativePath string) error {
	if rootPath == "" || relativePath == "" {
		return fmt.Errorf("rootPath và relativePath không được để trống")
	}
	cleanRel := strings.TrimPrefix(filepath.ToSlash(relativePath), "/")
	fullPath := filepath.Join(rootPath, filepath.FromSlash(cleanRel))

	return os.MkdirAll(fullPath, 0755)
}

// RenamePath renames a file or directory
func (a *App) RenamePath(rootPath string, oldRelPath string, newRelPath string) error {
	if rootPath == "" || oldRelPath == "" || newRelPath == "" {
		return fmt.Errorf("đường dẫn không hợp lệ")
	}
	oldClean := strings.TrimPrefix(filepath.ToSlash(oldRelPath), "/")
	newClean := strings.TrimPrefix(filepath.ToSlash(newRelPath), "/")

	oldFullPath := filepath.Join(rootPath, filepath.FromSlash(oldClean))
	newFullPath := filepath.Join(rootPath, filepath.FromSlash(newClean))

	if _, err := os.Stat(oldFullPath); os.IsNotExist(err) {
		return fmt.Errorf("tệp nguồn không tồn tại: %s", oldRelPath)
	}
	if _, err := os.Stat(newFullPath); err == nil {
		return fmt.Errorf("tên mới đã tồn tại: %s", newRelPath)
	}

	dir := filepath.Dir(newFullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.Rename(oldFullPath, newFullPath)
}

// DeletePath deletes a file or directory
func (a *App) DeletePath(rootPath string, relativePath string) error {
	if rootPath == "" || relativePath == "" {
		return fmt.Errorf("đường dẫn không hợp lệ")
	}
	cleanRel := strings.TrimPrefix(filepath.ToSlash(relativePath), "/")
	if cleanRel == "" || cleanRel == "." {
		return fmt.Errorf("không thể xóa thư mục gốc của Vault")
	}

	fullPath := filepath.Join(rootPath, filepath.FromSlash(cleanRel))
	return os.RemoveAll(fullPath)
}

// ShowInFolder reveals the file or folder in Windows File Explorer
func (a *App) ShowInFolder(rootPath string, relativePath string) error {
	cleanRel := strings.TrimPrefix(filepath.ToSlash(relativePath), "/")
	fullPath := filepath.Join(rootPath, filepath.FromSlash(cleanRel))

	cmd := exec.Command("explorer.exe", fmt.Sprintf("/select,%s", fullPath))
	return cmd.Start()
}

// SaveSession saves the current tabs and scroll states to disk
func (a *App) SaveSession(sessionJSON string) error {
	return os.WriteFile(a.sessionFile, []byte(sessionJSON), 0644)
}

// LoadSession loads the previous session
func (a *App) LoadSession() (string, error) {
	data, err := os.ReadFile(a.sessionFile)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// SearchVault performs multithreaded fast searching across all markdown files in the vault (capped at 100 results)
func (a *App) SearchVault(rootPath string, query string) ([]SearchResult, error) {
	if rootPath == "" || strings.TrimSpace(query) == "" {
		return nil, nil
	}

	// Cancel previous search query if still running (Feature A3)
	a.searchMu.Lock()
	if a.searchCancel != nil {
		a.searchCancel()
	}
	searchCtx, cancel := context.WithCancel(a.ctx)
	a.searchCancel = cancel
	a.searchMu.Unlock()

	defer cancel()

	lowerQuery := strings.ToLower(query)
	var mdFiles []string

	_ = filepath.WalkDir(rootPath, func(path string, d fs.DirEntry, err error) error {
		if searchCtx.Err() != nil {
			return filepath.SkipAll
		}
		if err != nil {
			return nil
		}
		name := d.Name()
		if d.IsDir() {
			if strings.HasPrefix(name, ".") || name == "node_modules" {
				return filepath.SkipDir
			}
			return nil
		}
		ext := strings.ToLower(filepath.Ext(name))
		if ext == ".md" || ext == ".markdown" || ext == ".txt" {
			mdFiles = append(mdFiles, path)
		}
		return nil
	})

	if searchCtx.Err() != nil {
		return nil, nil
	}

	var mu sync.Mutex
	var results []SearchResult
	var wg sync.WaitGroup
	const maxResults = 100

	// Worker pool to scan files concurrently
	workers := 8
	fileChan := make(chan string, len(mdFiles))

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				select {
				case <-searchCtx.Done():
					return
				case filePath, ok := <-fileChan:
					if !ok {
						return
					}

					mu.Lock()
					if len(results) >= maxResults {
						mu.Unlock()
						continue
					}
					mu.Unlock()

					f, err := os.Open(filePath)
					if err != nil {
						continue
					}

					scanner := bufio.NewScanner(f)
					lineNum := 1
					relPath, _ := filepath.Rel(rootPath, filePath)
					normRelPath := filepath.ToSlash(relPath)

					for scanner.Scan() {
						if searchCtx.Err() != nil {
							break
						}
						line := scanner.Text()
						if strings.Contains(strings.ToLower(line), lowerQuery) {
							snippet := strings.TrimSpace(line)
							if len(snippet) > 120 {
								snippet = snippet[:120] + "..."
							}

							mu.Lock()
							if len(results) < maxResults {
								results = append(results, SearchResult{
									Path:       normRelPath,
									Name:       filepath.Base(filePath),
									LineNumber: lineNum,
									Snippet:    snippet,
								})
							}
							reachedMax := len(results) >= maxResults
							mu.Unlock()

							if reachedMax {
								break
							}
						}
						lineNum++
					}
					_ = f.Close()
				}
			}
		}()
	}

	for _, file := range mdFiles {
		fileChan <- file
	}
	close(fileChan)

	wg.Wait()

	if searchCtx.Err() != nil {
		return nil, nil
	}

	return results, nil
}
