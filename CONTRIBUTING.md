# Hướng Dẫn Đóng Góp Cho TMarkdown (Contributing Guide) 🤝

Chào mừng bạn và cảm ơn bạn đã quan tâm đến việc đóng góp cho dự án **TMarkdown**!
Mọi đóng góp từ việc sửa lỗi chính tả, cải thiện tài liệu, đề xuất tính năng mới đến tối ưu hóa mã nguồn đều được đánh giá cao.

---

## 1. Thiết Lập Môi Trường Phát Triển (Setup Environment)

### Yêu cầu phần mềm:
- **Hệ điều hành**: Windows 10 hoặc Windows 11 (có sẵn Microsoft Edge WebView2).
- **Go**: Phiên bản `1.22+` ([Tải về từ golang.org](https://go.dev/dl/)).
- **Node.js**: Phiên bản `20+` LTS kèm `npm` ([Tải về từ nodejs.org](https://nodejs.org/)).
- **Wails CLI v2**:
  ```powershell
  go install github.com/wailsapp/wails/v2/cmd/wails@v2.17.0
  ```

### Các bước cài đặt:
1. **Clone mã nguồn dự án**:
   ```powershell
   git clone https://github.com/danghieuthang/TMarkdown.git
   cd TMarkdown
   ```
2. **Cài đặt thư viện Frontend**:
   ```powershell
   cd frontend
   npm install
   cd ..
   ```
3. **Khởi chạy chế độ phát triển (Live Hot-Reload)**:
   ```powershell
   # Sử dụng script PowerShell tự động nạp biến môi trường và chạy Wails Dev:
   .\dev.ps1

   # Hoặc chạy file Batch:
   .\dev.bat
   ```
   *Cửa sổ ứng dụng TMarkdown sẽ hiển thị ngay. Khi bạn chỉnh sửa mã nguồn trong `frontend/src/`, giao diện sẽ tự động cập nhật tức thì (HMR).*

---

## 2. Quy Chuẩn Mã Nguồn (Coding Standards)

Để giữ cho mã nguồn luôn sạch sẽ, dễ bảo trì và đạt hiệu năng tối đa, vui lòng tuân thủ các quy tắc sau:

### 2.1. Frontend (React 19 + TypeScript)
- **Kiểu dữ liệu rõ ràng**: Sử dụng TypeScript với strict mode, **tuyệt đối không sử dụng `any`**. Định nghĩa interface/type rõ ràng trong thư mục `frontend/src/types/`.
- **React Hooks**:
  - Khai báo đầy đủ mảng dependencies trong `useEffect`, `useCallback`, `useMemo`.
  - Hạn chế gọi `setState` đồng bộ bên trong effect gây render lặp.
- **Tối ưu DOM**: Với các văn bản lớn hàng chục ngàn dòng, hạn chế tạo quá nhiều thẻ DOM không cần thiết.

### 2.2. Giao Diện & CSS (Styling Guidelines)
- **Nguyên tắc Zero-Tailwind**: Dự án sử dụng 100% Vanilla CSS kết hợp hệ thống CSS Tokens trong `frontend/src/index.css`.
- **CSS Variables**: Bắt buộc sử dụng các biến CSS tokens có sẵn thay vì hardcode mã màu hex:
  - Nền: `var(--bg-workspace)`, `var(--bg-surface)`, `var(--bg-surface-elevated)`
  - Chữ: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
  - Điểm nhấn: `var(--accent-primary)`, `var(--accent-hover)`, `var(--accent-glow)`
  - Viền & Bo góc: `var(--border-subtle)`, `var(--border-medium)`, `var(--radius-md)`
- **Tương thích giao diện 100%**: Mọi thành phần giao diện mới phải được kiểm tra hiển thị rõ ràng trên cả **Dark Mode** lẫn **Light Mode**.

### 2.3. Backend (Go 1.22+)
- **Định dạng chuẩn**: Chạy `gofmt -s -w .` trước khi commit.
- **Xử lý lỗi (Error Handling)**: Luôn kiểm tra `if err != nil` và trả về lỗi có ngữ cảnh rõ ràng, không được bỏ qua hoặc nuốt lỗi âm thầm.
- **An toàn Goroutines**: Khi triển khai các tác vụ chạy nền, luôn quản lý vòng đời bằng `context.Context` có cơ chế hủy (`context.WithCancel`) để tránh rò rỉ bộ nhớ (Goroutine leak).

---

## 3. Quy Trình Tạo Nhánh & Commit (Git Conventions)

Chúng tôi áp dụng quy chuẩn đặt tên commit theo chuẩn [Conventional Commits](https://www.conventionalcommits.org/):

### Cú pháp commit:
```
<loại>: <mô tả ngắn gọn bằng tiếng Việt hoặc tiếng Anh>
```

### Các loại commit phổ biến:
- `feat:` Thêm một tính năng mới (ví dụ: `feat: them tinh nang xuat bang sang file excel`)
- `fix:` Sửa một lỗi (ví dụ: `fix: sua loi nhay sai outline khi trung tieu de`)
- `perf:` Cải tiến hiệu năng (ví dụ: `perf: toi uu single-pass ast parser`)
- `style:` Thay đổi giao diện, CSS, màu sắc không ảnh hưởng logic
- `docs:` Thêm hoặc cập nhật tài liệu
- `refactor:` Tái cấu trúc mã nguồn mà không đổi hành vi
- `chore:` Cập nhật dependencies, build script, cấu hình

---

## 4. Kiểm Thử & Gửi Pull Request (PR Process)

Trước khi gửi Pull Request, bạn hãy thực hiện các bước kiểm tra sau trên máy của mình:

### 1. Kiểm tra biên dịch & Linting:
```powershell
cd frontend

# Kiểm tra biên dịch TypeScript & Vite bundle
npm run build

# Kiểm tra cú pháp bằng Oxlint
npm run lint
```
*Đảm bảo lệnh `npm run build` kết thúc với mã `0` và `npm run lint` không có lỗi nghiêm trọng.*

### 2. Kiểm tra đóng gói ứng dụng:
```powershell
# Chạy script đóng gói thử bản release:
.\build.ps1
```
*Đảm bảo tệp `build\bin\TMarkdown.exe` được tạo thành công và chạy mượt mà.*

### 3. Gửi Pull Request:
1. Fork repository về tài khoản cá nhân của bạn.
2. Tạo nhánh tính năng mới: `git checkout -b feature/ten-tinh-nang`.
3. Commit các thay đổi và push lên fork: `git push origin feature/ten-tinh-nang`.
4. Mở Pull Request vào nhánh `main` của repository chính.
5. Điền đầy đủ thông tin vào mẫu PR Template (mô tả tính năng, các bước kiểm tra, ảnh chụp màn hình minh họa).

---

## 5. Báo Cáo Sự Cố & Đóng Góp Ý Tưởng

- **Báo cáo lỗi (Bug Report)**: Nếu bạn phát hiện lỗi, hãy tạo một Issue mới trên GitHub và chọn mẫu [Báo cáo lỗi](.github/ISSUE_TEMPLATE/bug_report.md) kèm theo các bước tái hiện chi tiết.
- **Đề xuất tính năng (Feature Request)**: Bạn có ý tưởng thú vị để cải thiện trải nghiệm đọc? Hãy tạo một Issue với mẫu [Đề xuất tính năng](.github/ISSUE_TEMPLATE/feature_request.md) để cùng thảo luận.

Cảm ơn bạn đã chung tay xây dựng **TMarkdown** ngày càng hoàn thiện và mạnh mẽ hơn! 🚀
