# TMarkdown v1.1.0 — Bản Nâng Cấp Toàn Diện: Xuất Dữ Liệu Bảng Cho Excel, Tùy Chỉnh Cột & Điều Chỉnh Độ Rộng Đọc 🎉

**TMarkdown** là ứng dụng chuyên đọc, tra cứu và quản lý tài liệu Markdown dài với hiệu năng cao, tối giản và mượt mà theo phong cách Obsidian. Ứng dụng được xây dựng trên kiến trúc **Go 1.22+ (Wails v2) + React 19 + TypeScript**.

---

### 📦 Tải về và Sử dụng Ngay (Windows x64)

- **[TMarkdown-windows-x64.zip](https://github.com/danghieuthang/TMarkdown/releases/download/v1.1.0/TMarkdown-windows-x64.zip)** *(Khuyên dùng)*: Tải về, giải nén và nhấp đúp `TMarkdown.exe` để mở ngay.
- **[TMarkdown.exe](https://github.com/danghieuthang/TMarkdown/releases/download/v1.1.0/TMarkdown.exe)**: Tệp thực thi độc lập trực tiếp.

> [!NOTE]
> Ứng dụng chạy mượt mà ngay trên **Windows 10 và Windows 11** mà không cần cài đặt thêm bất kỳ phần mềm hay môi trường lập trình nào nhờ có sẵn thành phần Microsoft Edge WebView2 tiêu chuẩn của hệ điều hành.

---

### 🚀 Có Gì Mới Trong Bản v1.1.0?

#### 1. 📊 Sao Chép Bảng Trực Tiếp Cho Excel & Tùy Chỉnh Cột Động
- **Thanh công cụ Table Card cố định**: Mọi bảng Markdown trong chế độ đọc được đóng gói thành Table Card với thanh tiêu đề riêng, hiển thị số lượng cột × dòng (`Bảng dữ liệu (N cột × M dòng)`).
- **1-Click Copy Excel**: Sao chép dữ liệu dạng kép (`text/html` + `text/plain` TSV). Nhấn `Ctrl + V` vào **Microsoft Excel** hoặc **Google Sheets** để dán bảng dữ liệu chuẩn ô, giữ nguyên dòng tiêu đề in đậm và ngắt dòng bên trong ô.
- **Hộp thoại Tùy chỉnh Cột (Column Customizer)**:
  - Tích chọn hoặc loại bỏ các cột không cần thiết trước khi copy.
  - Sử dụng nút mũi tên **Lên / Xuống** để sắp xếp lại thứ tự các cột theo ý muốn.
  - Tùy chọn có lấy hàng tiêu đề *(Header row)* hay không.
  - Khung **Live Preview** cập nhật trực tiếp bảng kết quả.
  - Tải bảng về máy dưới dạng tệp `.csv` với mã hóa **UTF-8 BOM (`\uFEFF`)** giúp Excel trên Windows hiển thị đúng 100% tiếng Việt có dấu.

#### 2. 📐 Hệ Thống Điều Chỉnh Độ Rộng Hiển Thị (Content Width System)
- Giải quyết triệt để vấn đề văn bản bị ép hẹp trên màn hình lớn hoặc bảng biểu phải cuộn ngang liên tục:
  - **Standard (840px)**: Tối ưu cho bài viết văn xuôi dài, thị giác dễ chịu.
  - **Wide (1200px)**: Mặc định tối ưu cho tài liệu kỹ thuật có code block và bảng biểu.
  - **Full Width (100%)**: Bung tối đa toàn bộ diện tích màn hình để xem trọn vẹn bảng nhiều cột.
- Chuyển đổi nhanh bằng nút bấm trực quan trên thanh TopBar hoặc Command Palette (`Ctrl + Shift + P`).

#### 3. ⚡ Nhảy Mục Lục Tức Thì & Khắc Phục Lỗi Trùng Tiêu Đề (Instant Jump & Slugger)
- **Instant Jump (0ms delay)**: Chuyển toàn bộ cơ chế cuộn chậm chạp sang nhảy tức thì kiểu Obsidian / VS Code.
- **HeadingSlugger**: Đảm bảo các tiêu đề trùng tên (như "Mô tả", "Cài đặt") nhận ID tuần tự duy nhất (`#heading`, `#heading-1`, `#heading-2`), nhảy chính xác 100% ngay lần click đầu tiên.
- **Target Pulse**: Hiệu ứng phát sáng nhẹ tại tiêu đề đích giúp nhận diện ngay vị trí vừa nhảy tới.
- **Khóa Scroll-Spy 200ms**: Loại bỏ hiện tượng rung giật mục lục khi chuyển trang.

#### 4. 🎨 Bộ Nhận Diện Logo Thương Hiệu Chính Thức
- Tích hợp biểu tượng TMarkdown độc quyền (Chữ T kết hợp ký hiệu Markdown `#` màu cam và trang sách mở).
- **Tự động thích ứng giao diện**: Bản trắng bạc trên Dark Mode và bản than chì trên Light Mode.
- Biểu tượng ứng dụng Windows (`.exe` và Taskbar) được đóng gói tệp đa kích thước `build/windows/icon.ico`.
- Màn hình **Welcome Hero Screen** sang trọng khi chưa mở tài liệu với 4 thẻ thao tác nhanh kèm phím tắt.

#### 5. 🖍️ Obsidian Highlights & Thanh Công Cụ Nổi (Floating Selection Tooltip)
- Hỗ trợ cú pháp Highlight Obsidian: `==nội dung==` với nền dạ quang dịu mắt.
- Bôi đen văn bản để mở tooltip thao tác nhanh: **Highlight**, **Trích dẫn** (`> ...`), và **Tìm trong toàn bộ Vault**.

#### 6. 🧘 Chế Độ Đọc Tập Trung (Zen Mode — `F11`)
- Ẩn toàn bộ giao diện xung quanh để tối đa hóa không gian tập trung đọc và suy ngẫm tài liệu.

---

### ✨ Các Tính Năng Cốt Lõi Được Duy Trì Từ v1.0.0
- **Scroll Memory Engine**: Ghi nhớ tọa độ cuộn tuyệt đối từng pixel và khôi phục phiên làm việc (`session.json`).
- **Single-Pass AST Parser**: Tiêu thụ CPU và RAM cực thấp (<60MB).
- **Goroutines Search + Cancellation**: Quét đa luồng toàn bộ Vault siêu tốc.
- **Realtime File Watcher (`fsnotify`)**: Tự động đồng bộ file thêm/sửa/xóa từ bên ngoài.
- **Command Palette (`Ctrl + Shift + P`)** & **Fuzzy Quick Switcher (`Ctrl + P`)**.
- **In-Page Search (`Ctrl + F`)** & **Giao diện Obsidian High Contrast**.
