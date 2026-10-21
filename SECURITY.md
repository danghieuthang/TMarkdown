# Chính Sách Bảo Mật & Quyền Riêng Tư (Security Policy) 🛡️

Dự án **TMarkdown** coi trọng tính an toàn, bảo mật và quyền riêng tư tuyệt đối của người dùng lên hàng đầu. Tài liệu này mô tả cam kết bảo vệ dữ liệu cục bộ và quy trình xử lý khi phát hiện lỗ hổng bảo mật.

---

## 1. Cam Kết Quyền Riêng Tư: 100% Offline & Local-First

TMarkdown được xây dựng dựa trên nguyên tắc **Local-First Software**:

1. **Không Thu Thập Dữ Liệu (Zero Telemetry)**:
   - Ứng dụng **không chứa bất kỳ trình theo dõi (tracking)**, mã phân tích hành vi người dùng (Google Analytics, Mixpanel), hay báo cáo lỗi ngầm (Sentry, Crashlytics).
2. **Không Kết Nối Máy Chủ Đám Mây Độc Lập**:
   - Toàn bộ nội dung tài liệu văn bản, ghi chú và kho lưu trữ (Vault) của bạn chỉ nằm duy nhất trên ổ đĩa cứng của bạn. Ứng dụng không bao giờ tải dữ liệu của bạn lên bất kỳ máy chủ nào.
3. **Lưu Trữ Cấu Hình Cục Bộ An Toàn**:
   - Tệp phiên làm việc (`%APPDATA%/TMarkdown/session.json`) và cấu hình giao diện chỉ lưu trữ cục bộ các thông tin cơ bản: đường dẫn thư mục, danh sách tab và vị trí cuộn trang để phục hồi khi mở lại app.
4. **Liên Kết Ngoài (External Links)**:
   - Khi bạn nhấp vào một liên kết web ngoài (`http://`, `https://`), ứng dụng mở liên kết đó bằng trình duyệt web mặc định của hệ điều hành, không can thiệp hay lưu lại lịch sử truy cập.

---

## 2. Các Phiên Bản Được Hỗ Trợ (Supported Versions)

Chúng tôi cung cấp các bản vá bảo mật và cập nhật tính năng cho các phiên bản sau:

| Phiên bản | Trạng thái hỗ trợ |
|---|---|
| **v1.1.x** | ✅ Được hỗ trợ chính thức và cập nhật bản vá |
| **v1.0.x** | ⚠️ Đề nghị nâng cấp lên phiên bản v1.1.0 mới nhất |
| **< v1.0.0** | ❌ Không còn hỗ trợ |

---

## 3. Quy Trình Báo Cáo Lỗ Hổng Bảo Mật (Reporting a Vulnerability)

Nếu bạn phát hiện bất kỳ vấn đề bảo mật nào liên quan đến ứng dụng TMarkdown (ví dụ: lỗ hổng thực thi lệnh trái phép trong Wails, injection trong WebView2, hoặc vấn đề tràn bộ đệm):

> [!CAUTION]
> **Vui lòng KHÔNG mở Issue công khai trên GitHub** để tránh làm ảnh hưởng đến người dùng khác trước khi lỗi được vá an toàn.

### Các bước báo cáo:
1. Gửi thông tin chi tiết qua email cá nhân của tác giả: **`danghieuthang@gmail.com`** (hoặc liên hệ qua GitHub Security Advisory).
2. Nội dung báo cáo vui lòng bao gồm:
   - Mô tả ngắn gọn về lỗ hổng.
   - Các bước tái hiện chi tiết (kèm mã khai thác mẫu Proof of Concept nếu có).
   - Phiên bản hệ điều hành và phiên bản TMarkdown đang gặp sự cố.
3. **Cam kết xử lý**:
   - Chúng tôi sẽ phản hồi xác nhận đã nhận thông tin trong vòng **48 giờ**.
   - Cung cấp bản vá thử nghiệm và phát hành phiên bản sửa lỗi trong thời gian sớm nhất.
   - Ghi nhận và tri ân đóng góp của bạn trong phần cảm ơn của bản phát hành tiếp theo.

Cảm ơn bạn đã đồng hành bảo vệ sự an toàn cho cộng đồng người dùng TMarkdown! 🔒
