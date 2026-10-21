# Changelog — Nhật Ký Thay Đổi 📝

Tất cả các thay đổi đáng chú ý của dự án **TMarkdown** sẽ được ghi chép lại trong tệp này.
Định dạng được dựa trên chuẩn [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) và tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.1.0] — 2026-10-21

### Added (Thêm mới)
- **Sao chép Bảng cho Excel & Tùy chỉnh cột**:
  - Tự động bọc mọi bảng trong văn bản thành **Table Card** với thanh công cụ cố định hiển thị số cột × dòng (`Bảng dữ liệu (N cột × M dòng)`).
  - Nút **"Copy Excel"** 1-click xuất dữ liệu chuẩn kép (`text/html` + `text/plain` TSV), cho phép dán trực tiếp vào Microsoft Excel / Google Sheets giữ nguyên định dạng từng ô, in đậm và ngắt dòng.
  - Hộp thoại **"Tùy chỉnh cột..." (TableCustomizerModal)**: cho phép bật/tắt cột, đảo thứ tự cột Lên/Xuống bằng mũi tên, bật/tắt dòng tiêu đề, có Live Preview xem trước và xuất file `.csv` có mã hóa UTF-8 BOM (`\uFEFF`).
- **Hệ thống điều chỉnh độ rộng hiển thị (Content Width System)**:
  - Bổ sung 3 chế độ độ rộng: `Standard (840px)`, `Wide (1200px)` và `Full Width (100%)`.
  - Nút chuyển đổi trực quan trên thanh TopBar và 3 phím lệnh nhanh trong Command Palette (`Ctrl + Shift + P`).
- **Bộ nhận diện thương hiệu TMarkdown**:
  - Logo chính thức tích hợp tại thanh TopBar với cơ chế tự đổi màu tương thích giao diện (`logo-white.png` cho Dark Mode, `logo.png` cho Light Mode).
  - Màn hình **Welcome Hero Screen** khi chưa mở tài liệu với logo phát sáng mờ (ambient glow) và 4 thẻ hành động nhanh (`Ctrl+P`, `Ctrl+O`, `Ctrl+N`, `Ctrl+Shift+P`).
  - Đóng gói biểu tượng Windows native đa kích thước `build/windows/icon.ico` và `build/appicon.png` (1024×1024).
  - Favicon mới cho Webview và trình duyệt.
- **Obsidian Highlights & Thanh công cụ nổi**:
  - Cú pháp `==nội dung==` với nền highlight dạ quang dịu mắt.
  - Tooltip nổi khi bôi đen văn bản: Highlight, Trích dẫn Markdown (`> ...`), Tìm kiếm trong toàn bộ Vault.
- **Chế độ đọc tập trung (Zen / Focus Mode)**:
  - Phím tắt `F11` ẩn toàn bộ sidebar và thanh công cụ.

### Changed (Thay đổi & Tối ưu)
- **Cơ chế nhảy mục lục Outline**: Chuyển từ cuộn mượt chậm chạp sang **Nhảy tức thì (Instant Jump — `behavior: 'auto'`)** kiểu Obsidian / VS Code (0ms delay).
- **Rút ngắn độ trễ khóa Scroll-Spy**: Giảm thời gian khóa chống rung mục lục xuống còn **200ms**, giao diện phản hồi cực kỳ nhanh nhạy (snappy).
- **Thanh TopBar**: Nâng cấp thương hiệu, nút độ rộng và các tooltip chi tiết.

### Fixed (Sửa lỗi)
- **Lỗi nhảy Outline lung tung khi có nhiều tiêu đề trùng tên**: Cải tiến thuật toán `HeadingSlugger` trong AST parser, đảm bảo ID được sinh tuần tự (`slug`, `slug-1`, `slug-2`), click Outline nhảy chính xác 100% ngay lần nhấp đầu tiên.
- **Lỗi lệch vị trí cuộn do content-visibility**: Gỡ bỏ thuộc tính `contain-intrinsic-size` ảo gây phình to DOM đột ngột khi cuộn.
- **Lỗi nút sao chép bảng bị ẩn**: Chuyển từ nút nổi khi hover sang thanh tiêu đề Table Card luôn hiển thị, khắc phục hoàn toàn vấn đề bị che khuất bởi thanh cuộn ngang `overflow-x: auto`.

---

## [v1.0.0] — 2026-10-20

### Added (Phiên bản đầu tiên)
- **Scroll Memory Engine**: Ghi nhớ tọa độ cuộn tuyệt đối theo từng pixel (`scrollTop`) và tỷ lệ phần trăm (`scrollRatio`).
- **Full Session Restore**: Tự động lưu và khôi phục không gian làm việc từ `%APPDATA%/TMarkdown/session.json`.
- **Single-Pass AST Parser**: Phân tích Markdown một lượt duy nhất, giảm 50% CPU, RAM < 60MB cho tệp 50.000 dòng.
- **Smart Outline TOC**: Mục lục tự động cuộn theo dõi Scroll-Spy, bộ lọc cấp độ H1-H6, ô tìm kiếm tiêu đề nhanh, thu gọn/mở rộng phân cấp.
- **Command Palette (`Ctrl + Shift + P` / `F1`)**: Bảng lệnh thao tác hệ thống bằng bàn phím.
- **Fuzzy Quick Switcher (`Ctrl + P`)**: Tìm kiếm tệp tin bằng thuật toán Subsequence Fuzzy Search và quét nội dung toàn bộ Vault bằng Goroutines song song.
- **Realtime File Watcher (`fsnotify`)**: Tự động đồng bộ cây file và nội dung tài liệu hai chiều trong thời gian thực.
- **In-Page Search (`Ctrl + F`)**: Tìm kiếm trong trang bằng TreeWalker highlight, hỗ trợ Enter / Shift+Enter.
- **Obsidian Theme (Dark / Light Mode)**: Giao diện Obsidian Deep Violet và Light High Contrast chuẩn WCAG AAA.
- **Windows Packaging**: Script đóng gói tự động `build.ps1` và `dev.ps1`.
