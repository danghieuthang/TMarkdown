# TMarkdown Frontend Core (React 19 + TypeScript) 💻

Thư mục này chứa toàn bộ mã nguồn giao diện người dùng của ứng dụng **TMarkdown**, được xây dựng trên nền tảng **React 19**, **TypeScript** và **Vite** với kiến trúc hướng thành phần (Component-Driven Architecture).

---

## 🛠️ Công Nghệ Sử Dụng

- **Framework**: React 19 (Hooks, Concurrent Mode)
- **Ngôn ngữ**: TypeScript 5.8+ (Strict Type Checking)
- **Build Tool**: Vite 8+
- **Linter**: Oxlint (Siêu tốc độ, viết bằng Rust)
- **Styling**: 100% Vanilla CSS Tokens (Zero-Tailwind, lấy cảm hứng từ Obsidian Dark & Light Theme)
- **Parser**: markdown-it + highlight.js (Single-Pass AST Parser)
- **Biểu tượng**: Lucide React Icons

---

## 📁 Cấu Trúc Thư Mục Frontend

```
frontend/
├── public/                     # Tài nguyên tĩnh: favicon.png, favicon.ico
├── src/
│   ├── assets/                 # Logo thương hiệu: logo.png, logo-white.png, logo-card.png
│   ├── components/             # Các khối thành phần giao diện chính
│   │   ├── Header/
│   │   │   └── TopBar.tsx      # Thanh công cụ trên cùng: Logo, Đổi theme, Nút độ rộng, Chọn Vault
│   │   ├── Sidebar/
│   │   │   └── FileTree.tsx    # Cây thư mục file, danh sách Yêu thích, Lịch sử mở gần đây
│   │   ├── Tabs/
│   │   │   └── TabBar.tsx      # Thanh quản lý các tab tài liệu (hỗ trợ Middle-Click đóng tab)
│   │   ├── Viewer/
│   │   │   ├── MarkdownViewer.tsx  # Bộ hiển thị tài liệu đọc (Reading Mode, Table Card, Tooltip)
│   │   │   └── MarkdownEditor.tsx  # Trình soạn thảo văn bản (Edit Mode)
│   │   ├── Table/
│   │   │   └── TableCustomizerModal.tsx # Hộp thoại tùy chỉnh cột, đảo thứ tự & xuất Excel/CSV
│   │   ├── Outline/
│   │   │   └── OutlineSidebar.tsx  # Thanh mục lục thông minh (Scroll-Spy, Bộ lọc H1-H6, Instant Jump)
│   │   ├── Search/
│   │   │   ├── SearchModal.tsx     # Bảng tìm kiếm mờ (Fuzzy Switcher) & Bảng lệnh (Command Palette)
│   │   │   └── InPageSearch.tsx    # Thanh tìm kiếm nội dung trong trang (Ctrl + F)
│   │   └── StatusBar.tsx       # Thanh trạng thái chân trang: Thống kê từ, kích cỡ chữ, tiến độ cuộn
│   ├── hooks/
│   │   └── useScrollMemory.ts  # Cỗ máy ghi nhớ vị trí cuộn tuyệt đối & tỷ lệ phần trăm
│   ├── utils/
│   │   ├── markdownParser.ts   # Bộ phân tích AST một lượt (Single-Pass) & HeadingSlugger
│   │   ├── tableExport.ts      # Tiện ích xuất dữ liệu bảng Clipboard kép (HTML Table + TSV) & CSV UTF-8 BOM
│   │   └── fileSystem.ts       # Cầu nối IPC giao tiếp với Go Backend (Wails Runtime)
│   ├── types/
│   │   └── index.ts            # Định nghĩa toàn bộ kiểu dữ liệu TypeScript của ứng dụng
│   ├── data/
│   │   └── sampleVault.ts      # Dữ liệu tài liệu mẫu khi khởi chạy lần đầu
│   ├── index.css               # Hệ thống design tokens, typography, Obsidian palette & micro-animations
│   ├── App.tsx                 # Bộ điều phối không gian làm việc chính (Workspace Coordinator)
│   └── main.tsx                # Điểm gắn kết ứng dụng React vào DOM
├── index.html                  # Khung HTML gốc & liên kết Font chữ Inter, JetBrains Mono
├── package.json                # Danh sách thư viện phụ thuộc
├── tsconfig.json               # Cấu hình TypeScript
└── vite.config.ts              # Cấu hình Vite bundler
```

---

## ⚡ Các Lệnh Thao Tác (Scripts)

Chạy các lệnh sau bên trong thư mục `frontend/`:

```powershell
# 1. Khởi chạy dev server độc lập (dành cho kiểm tra nhanh giao diện trên web):
npm run dev

# 2. Kiểm tra biên dịch TypeScript và đóng gói bundle:
npm run build

# 3. Kiểm tra cú pháp và quy chuẩn code bằng Oxlint:
npm run lint

# 4. Xem trước bản build tĩnh:
npm run preview
```

---

## 🎨 Quy Tắc Styling & CSS Tokens

Mọi thành phần giao diện mới đều phải sử dụng các biến CSS có sẵn trong `index.css`:
- Màu nền: `var(--bg-workspace)`, `var(--bg-surface)`, `var(--bg-surface-elevated)`
- Màu chữ: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
- Màu điểm nhấn: `var(--accent-primary)`, `var(--accent-hover)`, `var(--accent-glow)`
- Bo góc: `var(--radius-sm)`, `var(--radius-md)`, `var(--radius-lg)`
- Bóng đổ: `var(--shadow-sm)`, `var(--shadow-md)`, `var(--shadow-lg)`
