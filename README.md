# TMarkdown — Obsidian-Lite Markdown Reader & Workspace 🚀

Ứng dụng chuyên đọc, tra cứu và quản lý tài liệu Markdown dài với hiệu năng cao, tối giản và mượt mà theo phong cách Obsidian. Giải quyết triệt để vấn đề mất vị trí cuộn trang và giật lag trên các văn bản lớn của VS Code.

Được phát triển trên nền tảng **Go 1.22+ (Wails v2)** kết hợp **React 19 + TypeScript + Modern CSS Tokens**.

---

## 📥 Tải về Sử dụng Ngay (Dành cho Bạn bè & Người dùng Windows)

Bạn không cần cài đặt Go, Node.js hay bất kỳ phần mềm lập trình nào. Chỉ cần:

1. Truy cập trang **[Releases](https://github.com/REPLACE_WITH_YOUR_USERNAME/TMarkdown/releases/latest)**.
2. Tải tệp **`TMarkdown-windows-x64.zip`** (hoặc tệp `TMarkdown.exe`).
3. Giải nén và **nhấp đúp vào `TMarkdown.exe`** để bắt đầu sử dụng ngay lập tức!

> [!TIP]
> Ứng dụng chạy mượt mà ngay trên **Windows 10 và Windows 11** nhờ có sẵn thành phần Microsoft Edge WebView2 tiêu chuẩn của hệ điều hành.

---

## 🌟 Tại sao nên dùng TMarkdown?

| Vấn đề trên các ứng dụng thông thường | Giải pháp đột phá trên TMarkdown |
|---|---|
| **Mất vị trí đọc**: Đang đọc trang 40, chuyển tab khác rồi quay lại bị nhảy lên đầu trang. | **Ghi nhớ tọa độ cuộn tuyệt đối (Scroll Memory Engine)** theo từng pixel (`scrollTop`) và tỷ lệ phần trăm (`scrollRatio`). Chuyển tab hoặc mở lại file giữ nguyên vị trí cũ 100%. |
| **Giật lag tài liệu lớn**: File Markdown 20.000 – 50.000 dòng tải rất lâu và làm đơ giao diện. | **Single-Pass Parser**: Cắt giảm 50% CPU, render tức thì với mức tiêu thụ RAM chưa tới 60MB. |
| **Bảng biểu tràn màn hình**: Bảng nhiều cột làm vỡ giao diện đọc, phải cuộn cả trang. | **Table Responsive Wrapper**: Tự động bọc bảng trong thanh cuộn riêng với hàng tiêu đề dính (`sticky`) sang trọng. |
| **Tìm kiếm chậm trên kho tài liệu**: Tìm từ khóa trong hàng trăm file làm nghẽn máy. | **Goroutines Search + Cancellation**: Quét song song đa luồng siêu tốc, tự động hủy tác vụ cũ khi gõ từ khóa mới. |

---

## ✨ Các Tính Năng Nổi Bật

### 1. 📌 Ghi Nhớ Phiên Làm Việc (Full Session Restore)
- Tự động ghi nhớ thư mục Vault đang mở, các tab làm việc và vị trí cuộn xuống tệp `%APPDATA%/TMarkdown/session.json`.
- Khi khởi động lại ứng dụng, toàn bộ không gian làm việc của bạn được khôi phục tự động ngay tức khắc.

### 2. 📑 Mục Lục Thông Minh (Smart Outline TOC)
- **Scroll-Spy**: Thanh mục lục tự động nhận diện và bôi đậm tiêu đề tương ứng với đoạn văn đang hiển thị trên màn hình.
- **Lọc đề mục trực tiếp**: Gõ từ khóa vào ô *"Lọc tiêu đề..."* để tìm nhanh mục mong muốn kèm hiệu ứng phát sáng chữ.
- **Bộ lọc cấp độ sâu**: Chuyển nhanh giữa **Tất cả (H1–H6)**, **H1 - H2** (rất tiện cho tài liệu dài hàng chục trang) và **H1 - H3**.
- **Thu gọn phân cấp & Mở rộng toàn bộ**: Dễ dàng thu gọn các phân nhánh lớn để giữ tầm nhìn gọn gàng.

### 3. ⌨️ Bảng Lệnh Command Palette (`Ctrl + Shift + P` hoặc `F1` hoặc gõ `>`)
- Truy cập tức thì mọi lệnh hệ thống: đổi giao diện Sáng/Tối, tạo ghi chú mới, mở thư mục, tìm trong trang, ẩn hiện thanh công cụ, đóng tab... chỉ bằng bàn phím.

### 4. ⚡ Tìm Kiếm Mờ Siêu Tốc (Fuzzy Quick Switcher — `Ctrl + P`)
- Thuật toán Subsequence Fuzzy Search: Chỉ cần gõ các chữ cái viết tắt (ví dụ `ktht`) là tìm ra ngay tệp `01_Kien_Truc_He_Thong.md`.
- Hỗ trợ chuyển đổi nhanh sang tìm kiếm nội dung toàn bộ Vault bằng phím `Tab`.

### 5. 📂 Giám Sát Tệp Tin Hai Chiều Thời Gian Thực (`fsnotify`)
- Ứng dụng tự động phát hiện khi file được thêm, sửa, xóa từ bên ngoài (VS Code, Git, Syncthing) và tự động cập nhật cây thư mục và nội dung mà không làm mất trạng thái của bạn.

### 6. 🔍 Tìm Kiếm Nội Dung Trong Trang (`Ctrl + F`)
- Thanh tìm kiếm nổi với bộ đếm số lượng kết quả (`1 / 5`).
- Nhấn `Enter` để nhảy tới kết quả tiếp theo, `Shift + Enter` để quay lại, `Esc` để đóng và khôi phục DOM sạch sẽ.

### 7. 🎨 Giao Diện Obsidian Cao Cấp (Dark / Light Mode)
- **Dark Mode**: Phong cách Obsidian Deep sang trọng kết hợp điểm nhấn tím Violet.
- **Light Mode**: Thiết kế tương phản cao (High Contrast chuẩn WCAG AAA > 7:1) tối ưu riêng cho JSON và Code block, không gây mỏi mắt.

---

## ⌨️ Bảng Phím Tắt Nhanh (Cheat Sheet)

| Phím tắt | Chức năng |
|---|---|
| `Ctrl + P` | Mở hộp thoại chuyển đổi tệp tin nhanh (Fuzzy Switcher) |
| `Ctrl + Shift + P` hoặc `F1` | Mở Bảng Lệnh (Command Palette) |
| `Ctrl + N` | Tạo ghi chú Markdown mới trong Vault |
| `Ctrl + O` | Mở thư mục tài liệu khác trên máy tính |
| `Ctrl + F` | Tìm kiếm từ khóa trong trang tài liệu hiện tại |
| `Ctrl + B` | Bật / Tắt thanh cây thư mục bên trái (File Explorer) |
| `Ctrl + T` | Chuyển đổi giao diện Sáng / Tối (Light / Dark Theme) |
| `Ctrl + W` | Đóng tab tài liệu hiện tại |
| `Ctrl + 0` | Đặt lại cỡ chữ đọc chuẩn (15px) |
| `Ctrl + =` / `Ctrl + -` | Tăng / Giảm cỡ chữ đọc trực tiếp |
| `Chuột giữa` (Middle Click) | Nhấp con lăn chuột vào bất kỳ tab nào để đóng tab ngay lập tức |

---

## 🛠️ Dành cho Lập trình viên (Developer Guide)

Nếu bạn muốn tự chỉnh sửa mã nguồn hoặc tự build trên máy tính của mình:

### Yêu cầu môi trường:
- **Go 1.22+**
- **Node.js 20+ & npm**
- **Wails CLI v2** (`go install github.com/wailsapp/wails/v2/cmd/wails@v2.17.0`)

### 1. Khởi chạy chế độ phát triển (Live Hot-Reload):
```powershell
# Chạy script tự động nạp PATH và mở Wails Dev
.\dev.ps1
```

### 2. Đóng gói bản phát hành cục bộ (1-Click Package):
```powershell
# Script tự động build sạch và nén file zip vào thư mục release/
.\build.ps1
```
*Sau khi chạy xong, thư mục `release/` sẽ tự động mở lên với tệp `TMarkdown-windows-x64.zip` và `TMarkdown.exe` sẵn sàng để chia sẻ.*

---

## 📁 Cấu trúc Mã nguồn Dự án

```
TMarkdown/
├── .github/workflows/
│   └── release.yml     # CI/CD tự động build release trên GitHub Actions khi push tag
├── app.go              # Go Backend: File watcher fsnotify, tìm kiếm đa luồng, CRUD file, lưu session
├── main.go             # Điểm khởi chạy ứng dụng Wails & cấu hình cửa sổ Windows Mica
├── build.ps1 / .bat    # Script đóng gói bản phát hành Windows 1-click
├── dev.ps1 / .bat      # Script khởi chạy môi trường phát triển hot-reload
├── wails.json          # Cấu hình Wails v2
├── build/              # Chứa tệp thực thi sau khi biên dịch
└── frontend/           # Giao diện Vite + React 19 + TypeScript
    ├── src/
    │   ├── components/ # FileTree, MarkdownViewer, OutlineSidebar, SearchModal, TabBar, TopBar
    │   ├── hooks/      # useScrollMemory (Scroll-Spy & vị trí đọc pixel-perfect)
    │   ├── utils/      # markdownParser (Single-pass AST), fileSystem (Wails IPC bridge)
    │   ├── index.css   # Obsidian design tokens & typography
    │   └── App.tsx     # Bộ điều phối không gian làm việc chính
    └── wailsjs/        # Bindings tự động sinh giữa Go và TypeScript
```

---

## 📜 Giấy phép (License)

Dự án được phân phối dưới giấy phép **[MIT License](LICENSE)** — Bạn và bạn bè có thể tự do sử dụng, chỉnh sửa và chia sẻ mà không bị giới hạn.
