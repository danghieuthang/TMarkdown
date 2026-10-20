# TMarkdown v1.0.0 — Bản Phát Hành Chính Thức 🎉

**TMarkdown** là ứng dụng đọc và quản lý Markdown hiệu năng cao, tối giản theo phong cách Obsidian, được thiết kế riêng để xử lý mượt mà các tệp văn bản dài 10.000 – 50.000 dòng với kiến trúc **Go (Wails v2) + React + TypeScript**.

---

### 📦 Tải về và Sử dụng Ngay (Windows x64)

- **[TMarkdown-windows-x64.zip](https://github.com/REPLACE_WITH_YOUR_USERNAME/TMarkdown/releases/download/v1.0.0/TMarkdown-windows-x64.zip)** *(Khuyên dùng)*: Tải về, giải nén và nhấp đúp `TMarkdown.exe` để mở.
- **[TMarkdown.exe](https://github.com/REPLACE_WITH_YOUR_USERNAME/TMarkdown/releases/download/v1.0.0/TMarkdown.exe)**: File thực thi độc lập trực tiếp.

> [!NOTE]
> Ứng dụng chạy ngay trên **Windows 10 và Windows 11** mà không cần cài đặt thêm bất kỳ phần mềm hay môi trường lập trình nào (nhờ có sẵn Microsoft Edge WebView2).

---

### ✨ Tính Năng Nổi Bật trong Bản v1.0.0

1. **📌 Ghi nhớ Vị trí Cuộn Tuyệt đối (Scroll Memory Engine)**:
   - Lưu vết chính xác tọa độ cuộn theo từng pixel (`scrollTop`) và tỷ lệ phần trăm cho từng tệp.
   - Khi chuyển tab hoặc mở lại file, màn hình lập tức trở về đúng dòng bạn đang đọc.
   - Tự động ghi nhớ phiên làm việc (`session.json`): Mở lại app là tiếp tục đọc ngay lập tức.

2. **📑 Mục lục Thông minh với Bộ lọc & Phân cấp (Smart Outline TOC)**:
   - **Scroll-Spy**: Bôi đậm mục tiêu đề theo thời gian thực tương ứng với đoạn văn đang hiển thị.
   - **Lọc đề mục trực tiếp**: Ô tìm kiếm tiêu đề nhanh kèm hiệu ứng bôi màu từ khóa.
   - **Lọc theo cấp độ sâu**: Chuyển nhanh giữa `Tất cả`, `H1 - H2` (rất tiện cho tài liệu dài 50 trang), `H1 - H3`.
   - **Thu gọn / Mở rộng phân cấp**: Hỗ trợ thu gọn các phân nhánh và nút Mở rộng/Thu gọn toàn bộ.

3. **⌨️ Bảng Lệnh Tiện ích Command Palette (`Ctrl + Shift + P` hoặc `F1` hoặc gõ `>`)**:
   - Truy cập mọi thao tác nhanh bằng bàn phím phong cách VS Code / Obsidian.
   - Hỗ trợ đổi theme, tạo file mới, mở thư mục, tìm kiếm trong trang, ẩn hiện thanh công cụ.

4. **⚡ Tìm kiếm Mờ Siêu Tốc (Fuzzy Quick Switcher — `Ctrl + P`)**:
   - Thuật toán Subsequence Fuzzy Search: Chỉ cần gõ các chữ cái viết tắt (ví dụ `ktht`) là tìm ra ngay tệp `01_Kien_Truc_He_Thong.md`.
   - Tìm kiếm toàn bộ nội dung trong Vault bằng Goroutines song song của Go với cơ chế hủy truy vấn cũ (`context.WithCancel`).

5. **📂 Đồng bộ Hai Chiều Thời Gian Thực (Realtime File Watcher — `fsnotify`)**:
   - Tự động phát hiện khi file được thêm, sửa, xóa từ bên ngoài (VS Code, Git, Syncthing) và cập nhật giao diện không cần bấm F5.

6. **📊 Bảng Biểu Không Bao Giờ Tràn (Table Responsive Wrapper)**:
   - Tự động đóng gói bảng vào thanh cuộn riêng với hàng tiêu đề dính (sticky header) và hiệu ứng hover hàng sang trọng.

7. **🔍 Tìm Kiếm Nội Dung Trong Trang (`Ctrl + F`)**:
   - Tìm kiếm từ khóa ngay trên trang đọc với bộ đếm số lượng kết quả (`1 / 5`), phím tắt Enter / Shift+Enter để cuộn mượt giữa các kết quả.

8. **🎨 Giao Diện Obsidian Cao Cấp (Dark & Light Mode)**:
   - Dark Mode tông Obsidian Deep với điểm nhấn tím Violet.
   - Light Mode tối ưu độ tương phản cao cho JSON và Code block (chuẩn WCAG AAA > 7:1).
   - Phím tắt `Ctrl + T` để chuyển đổi nhanh giữa hai chế độ.
