import type { FileNode } from '../types';

export const SAMPLE_LONG_MARKDOWN = `# Hướng dẫn Kiến trúc Phần mềm & Tối ưu hóa Hiệu năng Ứng dụng

> [!NOTE]
> Tài liệu mẫu dài với hơn 3.000 dòng để bạn kiểm thử trực tiếp tính năng **Ghi nhớ vị trí cuộn (Scroll Memory)**, **Thanh mục lục thông minh (Smart Outline)** và **Đổi tab không mất vị trí đọc**.
> 
> 👉 **Liên kết nội bộ (Test Links)**: Bấm vào [02_Ghi_Chu_Ky_Thuat.md](02_Ghi_Chu_Ky_Thuat.md) hoặc Wiki-link [[Benchmark_Go_vs_Rust]] để kiểm tra việc mở tab mới mượt mà mà không bị reset vị trí!

---

## 1. Tổng quan Kiến trúc Hệ thống

Thiết kế kiến trúc phần mềm là nền tảng cốt lõi quyết định tính mở rộng, tính bảo trì và độ tin cậy của toàn bộ hệ thống công nghệ thông tin.

### 1.1 Mục tiêu Thiết kế
Mục tiêu cốt lõi của việc xây dựng hệ thống phần mềm hiệu năng cao:
- **Độ trễ thấp (Low Latency)**: Xử lý các yêu cầu (requests) dưới ngưỡng 20ms đối với các tác vụ đọc.
- **Khả năng mở rộng theo chiều ngang (Horizontal Scalability)**: Cho phép bổ sung thêm các node mà không cần gián đoạn dịch vụ.
- **Tính khả dụng cao (High Availability)**: Tối thiểu 99.99% uptime, tự động phục hồi khi có sự cố tại từng node độc lập.

### 1.2 Bối cảnh Áp dụng
Trong các dự án quy mô lớn, việc đồng bộ giữa các module đòi hỏi một mô hình kiến trúc phi tập trung (Decoupled Architecture), nơi các service giao tiếp thông qua message broker hoặc RPC tốc độ cao.

\`\`\`go
// Ví dụ xử lý song song trong Go (Goroutine Worker Pool)
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        fmt.Printf("Worker %d processing job %d\n", id, j)
        time.Sleep(time.Millisecond * 100)
        results <- j * 2
    }
}
\`\`\`

---

## 2. Quản lý Bộ nhớ & Thu gom Rác (Memory Management)

Quản lý bộ nhớ là yếu tố then chốt giúp tối ưu hóa ứng dụng native (Go, Rust, C++) so với các môi trường thông dịch.

### 2.1 Stack vs Heap Allocation
- **Stack Memory**: Cực nhanh, tự động thu hồi khi thoát khỏi stack frame.
- **Heap Memory**: Linh hoạt cho các biến có vòng đời không cố định, nhưng yêu cầu chi phí phân bổ và thu gom rác.

### 2.2 Kỹ thuật Tối ưu Escape Analysis
Trình biên dịch Go sử dụng phân tích thoát (Escape Analysis) để xác định xem một biến có thể nằm trên Stack hay bắt buộc phải lên Heap.

| Tiêu chí | Stack Allocation | Heap Allocation |
| :--- | :--- | :--- |
| **Tốc độ truy xuất** | Cực nhanh (L1/L2 Cache) | Chậm hơn, có thể phân mảnh |
| **Chi phí giải phóng** | 0 CPU cycle | Phụ thuộc GC cycle |
| **Dung lượng tối đa** | Giới hạn theo thread stack | Giới hạn theo RAM khả dụng |

---

## 3. Cơ chế Khóa và Đồng bộ hóa Luồng (Concurrency Primitives)

Khi nhiều tiến trình hoặc luồng cùng truy cập một tài nguyên, nguy cơ xảy ra Race Condition là rất lớn.

### 3.1 Mutex vs RWMutex
- \`sync.Mutex\`: Khóa độc quyền cả đọc và ghi.
- \`sync.RWMutex\`: Cho phép nhiều goroutine cùng đọc đồng thời, chỉ khóa độc quyền khi có tác vụ ghi.

\`\`\`go
type CacheStore struct {
    sync.RWMutex
    data map[string]string
}

func (c *CacheStore) Get(key string) (string, bool) {
    c.RLock()
    defer c.RUnlock()
    val, exists := c.data[key]
    return val, exists
}
\`\`\`

### 3.2 Kênh truyền thông tin (Channels)
Triết lý nổi tiếng của Go: *"Do not communicate by sharing memory; instead, share memory by communicating."*

---

## 4. Xây dựng Trình Đọc Markdown Hiệu năng Cao

Một trình đọc Markdown chuyên nghiệp cho tài liệu dài đòi hỏi các kỹ thuật xử lý UI đặc thù:

### 4.1 Khắc phục lỗi mất vị trí cuộn trên VS Code
- **Vấn đề**: VS Code render webview độc lập cho từng file preview. Khi chuyển tab, iframe preview bị hủy hoặc reset \`window.scrollY\`.
- **Giải pháp của TMarkdown**:
  1. Ghi nhận chính xác tọa độ pixel \`scrollTop\` và tỷ lệ phần trăm \`scrollRatio\`.
  2. Lưu trữ có index theo đường dẫn file trong bộ nhớ.
  3. Khôi phục bằng \`requestAnimationFrame\` ngay khi tab được kích hoạt trở lại.

### 4.2 Tối ưu hóa DOM với \`content-visibility: auto\`
Thay vì phải tính toán lại layout cho toàn bộ văn bản 50.000 từ, ta áp dụng CSS \`content-visibility: auto\`. Trình duyệt sẽ bỏ qua việc tính toán các khối nội dung đang nằm ngoài khung nhìn.

---

## 5. Bảng kiểm tra chất lượng (Quality Checklist)

Dưới đây là các tiêu chuẩn bắt buộc cho phiên bản đầu tiên:

- [x] Khởi tạo layout 3 cột Obsidian hiện đại
- [x] Ghi nhớ vị trí cuộn khi chuyển đổi tab
- [x] Tự động highlight mục lục (Scroll-Spy)
- [x] Hỗ trợ chuyển đổi chế độ xem và chế độ sửa
- [x] Phím tắt tìm kiếm nhanh Ctrl+P và Ctrl+F
- [ ] Tích hợp đồng bộ đám mây (Giai đoạn tiếp theo)

---

## 6. Phân tích Dữ liệu Cấu hình (JSON & Cấu hình)

Dưới đây là cấu hình JSON mẫu để kiểm tra độ tương phản màu sắc ở chế độ Sáng (Light Mode) và chế độ Tối (Dark Mode):

\`\`\`json
{
  "project": "TMarkdown Reader",
  "version": "1.2.0",
  "isProduction": true,
  "system": {
    "core": "Go-Wails-v2",
    "frontend": "React-19",
    "theme": "Light-Adaptive",
    "contrastRatio": "WCAG-AAA"
  },
  "features": [
    "Smart-Outline-Disambiguation",
    "Scroll-Memory-Pixel-Accurate",
    "Instant-Tab-Switching",
    "In-Page-Search"
  ],
  "performance": {
    "renderTimeMs": 2.45,
    "memoryUsageMb": 18.5,
    "totalNodes": 1250,
    "debugError": null
  }
}
\`\`\`

---

## 7. Quy trình Vận hành - Giai đoạn 1

Tài liệu kiểm thử trường hợp nhiều mục con trùng tên (Ví dụ: A. Mục 1 ở nhiều section khác nhau):

### A. Mục 1: Khởi tạo Dịch vụ
Nội dung chi tiết của Mục 1 thuộc Giai đoạn 1. Bước này tập trung vào cấu hình runtime và cấp phát bộ nhớ ban đầu cho tiến trình xử lý.

### B. Mục 2: Kiểm tra Kết nối
Nội dung chi tiết của Mục 2 thuộc Giai đoạn 1. Đảm bảo toàn bộ socket và kênh truyền dữ liệu IPC hoạt động ổn định.

---

## 8. Quy trình Vận hành - Giai đoạn 2

Phần tiếp theo của quy trình vận hành với cấu trúc tiêu đề lặp lại để kiểm tra thanh Outline:

### A. Mục 1: Khởi tạo Dịch vụ
Nội dung chi tiết của Mục 1 thuộc Giai đoạn 2. Điểm kiểm tra: thanh Outline chỉ được highlight chính xác mục này khi cuộn tới đây, không được highlight toàn bộ các mục trùng tên khác!

### B. Mục 2: Kiểm tra Kết nối
Nội dung chi tiết của Mục 2 thuộc Giai đoạn 2. Khi click vào mục này trên Outline, màn hình phải cuộn mượt mà đến đúng vị trí này thay vì nhảy về Giai đoạn 1.

---

## 9. Kết luận & Định hướng Tương lai

Với việc kết hợp backend Go và giao diện webview siêu nhẹ, chúng ta đạt được sự cân bằng hoàn hảo giữa tốc độ thực thi, khả năng tùy biến giao diện vô hạn và mức tiêu thụ RAM cực thấp.
`;

export const SAMPLE_VAULT_FILES: FileNode[] = [
  {
    id: 'root-1',
    name: '01_Kien_Truc_He_Thong.md',
    path: '/01_Kien_Truc_He_Thong.md',
    isDirectory: false,
    size: 14200
  },
  {
    id: 'root-2',
    name: '02_Ghi_Chu_Ky_Thuat.md',
    path: '/02_Ghi_Chu_Ky_Thuat.md',
    isDirectory: false,
    size: 8500
  },
  {
    id: 'folder-1',
    name: 'Research',
    path: '/Research',
    isDirectory: true,
    children: [
      {
        id: 'child-1',
        name: 'Benchmark_Go_vs_Rust.md',
        path: '/Research/Benchmark_Go_vs_Rust.md',
        isDirectory: false,
        size: 9200
      },
      {
        id: 'child-2',
        name: 'Wails_Architecture_Deep_Dive.md',
        path: '/Research/Wails_Architecture_Deep_Dive.md',
        isDirectory: false,
        size: 11400
      }
    ]
  },
  {
    id: 'root-3',
    name: 'README.md',
    path: '/README.md',
    isDirectory: false,
    size: 3200
  }
];

export const SAMPLE_FILE_CONTENTS: Record<string, string> = {
  '/01_Kien_Truc_He_Thong.md': SAMPLE_LONG_MARKDOWN,
  '/02_Ghi_Chu_Ky_Thuat.md': `# Ghi Chú Kỹ Thuật Dự Án TMarkdown

## 1. Vấn đề cốt lõi cần giải quyết
Khi đọc tài liệu dài trên VS Code, người dùng chuyển sang file khác để tra cứu và quay lại thì preview tự động nhảy lên đầu trang hoặc mất dấu đoạn đang đọc.

## 2. Giải pháp kỹ thuật của TMarkdown
1. **Lưu trữ chính xác toạ độ cuộn**:
   - Lưu trữ pixel \`scrollTop\`
   - Lưu trữ tỷ lệ \`scrollRatio\`
2. **Khôi phục mượt mà**:
   - Gọi lệnh phục hồi ngay khi DOM sẵn sàng.
3. **Thanh mục lục (Outline)**:
   - Tự động bắt vị trí cuộn và bôi đậm tiêu đề tương ứng.
`,
  '/Research/Benchmark_Go_vs_Rust.md': `# Benchmark So Sánh Hiệu Năng Go vs Rust

## 1. Tiêu chí Đánh giá
- Tốc độ Parsing Markdown 50.000 dòng
- Mức tiêu thụ bộ nhớ RAM nền
- Thời gian tìm kiếm từ khóa trên 10.000 file

## 2. Kết quả Thử nghiệm
- **Go (Wails)**: Tiêu thụ khoảng 35MB RAM, thời gian khởi động < 0.3s.
- **Rust (Tauri)**: Tiêu thụ khoảng 30MB RAM, thời gian khởi động < 0.2s.
`,
  '/Research/Wails_Architecture_Deep_Dive.md': `# Phân Tích Kiến Trúc Wails v2

## 1. IPC Binding
Wails tự động tạo ra các hàm JavaScript/TypeScript tương ứng với các method trong Struct Go của bạn.

## 2. Tận dụng WebView2
Trên Windows 10 và 11, WebView2 đã được Microsoft cài đặt sẵn trong hệ điều hành, giúp kích thước file cài đặt của ứng dụng chỉ còn khoảng 15MB.
`,
  '/README.md': `# TMarkdown — Trình đọc Markdown Tối giản & Hiệu năng Cao

Ứng dụng đọc và quản lý Markdown lấy cảm hứng từ Obsidian, tập trung vào:
- Giữ nguyên vị trí cuộn khi chuyển đổi tab
- Mục lục thông minh Scroll-Spy
- Tìm kiếm nhanh file và nội dung
`
};
