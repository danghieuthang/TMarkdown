<p align="center">
  <img src="frontend/src/assets/logo.png" alt="TMarkdown Logo" width="130" />
</p>

<h1 align="center">TMarkdown — Obsidian-Lite Markdown Reader & Workspace 🚀</h1>

<p align="center">
  <strong>Ứng dụng chuyên đọc, tra cứu và xử lý tài liệu Markdown dài với hiệu năng cao, tối giản và mượt mà theo phong cách Obsidian.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=flat&logo=windows" alt="Platform Windows" />
  <img src="https://img.shields.io/badge/Backend-Go%201.22%2B%20%7C%20Wails%20v2-00ADD8?style=flat&logo=go" alt="Go Wails" />
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript-61DAFB?style=flat&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License MIT" />
  <img src="https://img.shields.io/badge/Privacy-100%25%20Offline%20Local--First-8b5cf6" alt="Local First" />
</p>

---

## 📥 Tải về Sử dụng Ngay (Windows x64)

Bạn không cần cài đặt Go, Node.js hay bất kỳ phần mềm lập trình nào:

1. Truy cập trang phát hành: **[Releases](https://github.com/danghieuthang/TMarkdown/releases/latest)**.
2. Tải tệp nén **`TMarkdown-windows-x64.zip`** (hoặc tệp `TMarkdown.exe`).
3. Giải nén và **nhấp đúp vào `TMarkdown.exe`** để bắt đầu sử dụng ngay lập tức!

> [!TIP]
> Ứng dụng chạy mượt mà ngay trên **Windows 10 và Windows 11** nhờ sử dụng Microsoft Edge WebView2 tiêu chuẩn có sẵn của hệ điều hành.

---

## 🌟 Tại sao nên dùng TMarkdown?

| Vấn đề trên các ứng dụng thông thường | Giải pháp đột phá trên TMarkdown |
|---|---|
| **Mất vị trí đọc**: Đang đọc dở trang 40, chuyển tab khác rồi quay lại bị nhảy về đầu trang. | **Scroll Memory Engine**: Ghi nhớ tọa độ cuộn tuyệt đối theo từng pixel (`scrollTop`) và tỷ lệ (`scrollRatio`). Chuyển tab hoặc mở lại file giữ nguyên vị trí cũ 100%. |
| **Giật lag tài liệu lớn**: File Markdown 10.000 – 50.000 dòng tải chậm và đơ giao diện. | **Single-Pass AST Parser**: Cắt giảm 50% thời gian xử lý, render tức thì với mức tiêu thụ RAM chưa tới 60MB. |
| **Bảng biểu tràn màn hình**: Bảng nhiều cột ép hẹp chữ, phải cuộn ngang cả trang web. | **Table Card & Responsive System**: Tự động đóng gói bảng vào Table Card độc lập, hàng tiêu đề dính (`sticky`), cùng 3 chế độ độ rộng đọc (`Standard 840px`, `Wide 1200px`, `Full 100%`). |
| **Không copy được bảng vào Excel**: Dán bảng từ Markdown bị dồn hết vào một cột duy nhất. | **Table Excel Export & Column Customizer**: 1-click copy dữ liệu chuẩn kép (`HTML Table` + `TSV`), dán trực tiếp vào Excel / Google Sheets chuẩn từng ô, hỗ trợ chọn lọc và đảo thứ tự cột trước khi copy. |
| **Nhảy Outline lung tung**: Khi có nhiều đề mục trùng tên (như "Mô tả", "Cài đặt"), nhấp mục lục bị nhảy sai chỗ. | **HeadingSlugger & Instant Jump**: Cơ chế sinh ID tuần tự không trùng lặp, nhảy tức thì 0ms kiểu Obsidian kèm hiệu ứng chớp sáng định vị. |
| **Tìm kiếm chậm trên kho tài liệu**: Tìm từ khóa trong hàng trăm file làm treo đơ máy. | **Goroutines Search + Cancellation**: Quét song song đa luồng siêu tốc, tự động hủy tác vụ cũ khi người dùng gõ từ khóa mới. |

---

## ✨ Các Tính Năng Nổi Bật

### 1. 📊 Sao Chép Bảng Cho Excel & Tùy Chỉnh Cột (Table Card & Excel Export)
- **Thanh công cụ cố định**: Mỗi bảng trong chế độ đọc được đóng gói thành Table Card với thanh tiêu đề hiển thị số lượng cột × dòng.
- **1-Click Copy Excel**: Sao chép dữ liệu dạng kép (`text/html` + `text/plain` TSV). Nhấn `Ctrl + V` vào Microsoft Excel hoặc Google Sheets để nhận bảng dữ liệu chuẩn ô, giữ nguyên in đậm header và ngắt dòng trong ô.
- **Tùy chỉnh cột động (Column Customizer)**: Bấm *"Tùy chỉnh cột..."* để mở popup:
  - Tích chọn hoặc bỏ chọn các cột cần lấy.
  - Dùng nút mũi tên Lên/Xuống để đổi vị trí, đảo thứ tự cột.
  - Bật/tắt dòng tiêu đề *(Header row)*.
  - Khung **Live Preview** xem trước bảng cập nhật trực tiếp.
  - Xuất bảng ra file `.csv` có mã hóa **UTF-8 BOM (`\uFEFF`)** giúp Excel trên Windows mở tiếng Việt có dấu không bị lỗi font.

### 2. 📐 Hệ Thống Điều Chỉnh Độ Rộng Hiển Thị (Content Width System)
- Chuyển đổi nhanh 3 mức độ rộng đọc ngay trên thanh TopBar hoặc Command Palette:
  - **Standard (840px)**: Độ rộng chuẩn lý tưởng cho bài viết văn bản dài, tối ưu thị giác, không mỏi mắt.
  - **Wide (1200px)**: Mặc định cân bằng, rộng rãi cho tài liệu kỹ thuật có bảng biểu và code block.
  - **Full Width (100%)**: Bung tối đa toàn bộ diện tích màn hình lớn, loại bỏ hoàn toàn thanh cuộn ngang khi xem các bảng dữ liệu khổng lồ.

### 3. 📑 Mục Lục Thông Minh (Smart Outline TOC & Instant Jump)
- **Instant Jump (Nhảy tức thì)**: Click mục lục nhảy ngay lập tức đến tiêu đề (0ms delay) kiểu Obsidian / VS Code.
- **HeadingSlugger**: Tự động sinh ID duy nhất (`#heading`, `#heading-1`, `#heading-2`), triệt tiêu hoàn toàn lỗi nhảy sai vị trí khi văn bản có nhiều mục trùng tên.
- **Target Pulse**: Hiệu ứng phát sáng nhẹ tại tiêu đề đích khi nhảy tới, giúp nhận diện ngay ngữ cảnh đọc.
- **Lọc đề mục trực tiếp**: Gõ từ khóa vào ô *"Lọc tiêu đề..."* để tìm nhanh mục mong muốn.
- **Bộ lọc cấp độ sâu**: Chuyển nhanh giữa **Tất cả (H1–H6)**, **H1 - H2** và **H1 - H3**.
- **Thu gọn phân cấp & Mở rộng toàn bộ**: Dễ dàng thu gọn các nhánh lớn để giữ tầm nhìn gọn gàng.

### 4. 🖍️ Obsidian Highlights & Thanh Công Cụ Nổi (Floating Tooltip)
- Hỗ trợ cú pháp Highlight Obsidian: `==nội dung nổi bật==` hiển thị nền vàng dạ quang tinh tế.
- Bôi đen bất kỳ đoạn văn bản nào để mở thanh công cụ nổi:
  - **Highlight**: Tự động chèn/gỡ thẻ highlight.
  - **Trích dẫn**: Sao chép văn bản dưới dạng quote Markdown (`> ...`).
  - **Tìm Vault**: Tìm kiếm đoạn văn bản được chọn trong toàn bộ kho tài liệu.

### 5. 🧘 Chế Độ Tập Trung (Zen / Focus Mode — `F11`)
- Ẩn toàn bộ thanh công cụ, cây thư mục và mục lục để toàn tâm toàn ý vào việc đọc và nghiên cứu tài liệu.
- Nút thoát nổi mờ ở góc trên bên phải hoặc nhấn lại phím `F11`.

### 6. 📌 Ghi Nhớ Phiên Làm Việc (Full Session Restore)
- Tự động ghi nhớ thư mục Vault đang mở, danh sách tab và vị trí cuộn xuống tệp `%APPDATA%/TMarkdown/session.json`.
- Khi khởi động lại ứng dụng, toàn bộ không gian làm việc của bạn được khôi phục ngay tức khắc.

### 7. ⌨️ Bảng Lệnh Command Palette (`Ctrl + Shift + P` hoặc `F1`)
- Truy cập tức thì mọi lệnh hệ thống: đổi giao diện Sáng/Tối, tạo ghi chú mới, mở thư mục, tìm trong trang, đổi độ rộng, đóng tab... chỉ bằng bàn phím.

### 8. ⚡ Tìm Kiếm Mờ Siêu Tốc (Fuzzy Quick Switcher — `Ctrl + P`)
- Thuật toán Subsequence Fuzzy Search: Chỉ cần gõ các chữ cái viết tắt (ví dụ `ktht`) là tìm ra ngay tệp `01_Kien_Truc_He_Thong.md`.
- Hỗ trợ chuyển đổi nhanh sang tìm kiếm nội dung toàn bộ Vault bằng phím `Tab`.

### 9. 📂 Giám Sát Tệp Tin Hai Chiều Thời Gian Thực (`fsnotify`)
- Tự động phát hiện khi file được thêm, sửa, xóa từ bên ngoài (VS Code, Git, Syncthing) và cập nhật cây thư mục và nội dung mà không làm mất trạng thái của bạn.

### 10. 🔍 Tìm Kiếm Nội Dung Trong Trang (`Ctrl + F`)
- Thanh tìm kiếm nổi với bộ đếm số lượng kết quả (`1 / 5`), phím tắt `Enter` / `Shift + Enter` để duyệt nhanh giữa các kết quả.

### 11. 🎨 Giao Diện Obsidian Cao Cấp (Dark / Light Mode)
- **Dark Mode**: Phong cách Obsidian Deep sang trọng kết hợp điểm nhấn tím Violet.
- **Light Mode**: Thiết kế tương phản cao (High Contrast chuẩn WCAG AAA > 7:1) tối ưu riêng cho bảng biểu, JSON và Code block.

---

## ⌨️ Bảng Phím Tắt Nhanh (Cheat Sheet)

| Phím tắt | Chức năng |
|---|---|
| `Ctrl + P` | Mở hộp thoại chuyển đổi tệp tin nhanh (Fuzzy Switcher) |
| `Ctrl + Shift + P` hoặc `F1` | Mở Bảng Lệnh Hệ Thống (Command Palette) |
| `Ctrl + N` | Tạo ghi chú Markdown mới trong Vault |
| `Ctrl + O` | Mở thư mục tài liệu khác trên máy tính |
| `Ctrl + F` | Tìm kiếm từ khóa trong trang tài liệu hiện tại |
| `Ctrl + B` | Bật / Tắt thanh cây thư mục bên trái (File Explorer) |
| `Ctrl + T` | Chuyển đổi giao diện Sáng / Tối (Light / Dark Theme) |
| `F11` | Bật / Tắt chế độ đọc tập trung (Zen Mode) |
| `Ctrl + W` | Đóng tab tài liệu hiện tại |
| `Ctrl + 0` | Đặt lại cỡ chữ đọc chuẩn (15px) |
| `Ctrl + =` / `Ctrl + -` | Tăng / Giảm cỡ chữ đọc trực tiếp |
| `Chuột giữa` (Middle Click) | Nhấp con lăn chuột vào bất kỳ tab nào để đóng tab ngay lập tức |

---

## 📖 Tài Liệu Dự Án (Documentation Suite)

- **[RELEASE_NOTES.md](RELEASE_NOTES.md)**: Chi tiết các bản phát hành và tính năng mới nhất.
- **[CHANGELOG.md](CHANGELOG.md)**: Nhật ký thay đổi chuẩn Keep a Changelog và SemVer.
- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Tài liệu phân tích kiến trúc kỹ thuật hệ thống (Go Backend + Wails IPC + React 19 Frontend).
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Hướng dẫn tham gia đóng góp mã nguồn, setup môi trường và quy chuẩn code.
- **[SECURITY.md](SECURITY.md)**: Chính sách bảo mật và cam kết kiến trúc Local-First 100% Offline.

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
*Sau khi chạy xong, thư mục `release/` sẽ tự động mở lên với tệp `TMarkdown-windows-x64.zip` và `TMarkdown.exe` sẵn sàng để sử dụng và chia sẻ.*

---

## 📜 Giấy phép (License)

Dự án được phân phối dưới giấy phép **[MIT License](LICENSE)** — Tự do sử dụng, chỉnh sửa và chia sẻ mã nguồn.
