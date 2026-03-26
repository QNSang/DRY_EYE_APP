# 🔐 Chính sách Quyền riêng tư & Bảo mật (Privacy First)

Dự án DryEyeGuard được xây dựng với nguyên tắc cốt lõi: **Quyền riêng tư là ưu tiên hàng đầu**. Chúng tôi cam kết bảo vệ dữ liệu hình ảnh và thông tin của bạn thông qua các cơ chế kỹ thuật nghiêm ngặt.

## 1. Không Lưu trữ Hình ảnh & Video (Zero-Store Policy)
Ứng dụng không bao giờ lưu trữ, sao chép hoặc truyền tải hình ảnh/video của bạn ra khỏi thiết bị.
- **Xử lý Luồng (Stream Processing)**: Webcam chỉ được sử dụng để trích xuất các điểm mốc (Landmarks) trên khuôn mặt thông qua AI (MediaPipe).
- **Huỷ Luồng (Stream Destruction)**: Ngay sau khi các điểm mốc được tính toán (trong RAM), khung hình video sẽ được huỷ bỏ ngay lập tức trước khi khung hình tiếp theo được xử lý.

## 2. Xử lý Toàn bộ trên Máy khách (On-Device Training/Inference)
Mọi tính toán liên quan đến AI và Thị giác máy tính đều diễn ra trực tiếp trên trình duyệt hoặc bộ xử lý của máy tính bạn (CPU/GPU cục bộ).
- Không có dữ liệu khuôn mặt nào được gửi lên "Cloud" hay bất kỳ máy chủ bên thứ ba nào.
- Ứng dụng có thể chạy hoàn toàn **Offline** mà không cần kết nối Internet sau khi đã tải các mô hình AI ban đầu.

## 3. Quản lý Dữ liệu Sức khỏe Cục bộ
Các thông tin về lịch sử chớp mắt, điểm khảo sát OSDI và kết quả chẩn đoán:
- Được lưu trữ duy nhất trong **IndexedDB** thuộc trình duyệt/ứng dụng của bạn.
- Bạn có quyền kiểm soát toàn bộ: Có thể xoá toàn bộ lịch sử này bất kỳ lúc nào trong phần **Settings > Clear Data**.

## 4. Minh bạch & Đồng ý (Consent-Based)
Ứng dụng chỉ bật camera khi:
- Bạn chủ động bắt đầu phiên "Work Companion" hoặc "Eye Checkup".
- Bạn đã nhấn "Đồng ý" (Accept) trên thông báo quyền truy cập camera của trình duyệt/hệ điều hành.
- Có đèn chỉ báo camera (Hardware LED) trên thiết bị của bạn luôn sáng khi ứng dụng đang quét.

## 5. Mã nguồn Mở (Open Source)
Vì dự án là mã nguồn mở, bất kỳ chuyên gia bảo mật nào cũng có thể kiểm tra định kỳ mã nguồn để xác nhận các cam kết bảo mật này là đúng sự thật.

---

