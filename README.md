# DryEyeGuard: Trợ lý AI Bảo vệ mắt

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Technology: MediaPipe](https://img.shields.io/badge/Core-MediaPipe-blue)](https://google.github.io/mediapipe/)
[![Platform: Electron](https://img.shields.io/badge/Platform-Electron-lightgrey)](https://www.electronjs.org/)

**DryEyeGuard** là người bạn đồng hành trong việc phòng ngừa hội chứng khô mắt (Dry Eye Syndrome) và cải thiện thói quen làm việc cho người dùng máy tính thường xuyên. Ứng dụng kết hợp sức mạnh của **Thị giác Máy tính (Computer Vision)** và **Trí tuệ Nhân tạo (AI)** để theo dõi thói quen làm việc và đưa ra các khuyến nghị sức khỏe cá nhân hóa ngay tại thiết bị.

---

##  Điều hướng Tài liệu (Documentation)

Dành cho nhà phát triển và ban giám khảo **Datathon 2025**, vui lòng tham khảo các tài liệu chuyên ngành dưới đây:

*   **[ Kiến trúc Hệ thống (Architecture)](./docs/ARCHITECTURE.md)**: Giải thích chi tiết **Hệ thống Điểm (Score System)**, Sơ đồ **High-level Architecture** và Thuật toán **Adaptive 20-20-20**.
*   **[ Tính năng & Cơ chế Thông minh (Mechanisms)](./docs/ARCHITECTURE.md#2-các-cơ-chế-thông-minh-adaptive-smart-mechanisms)**: Đi sâu vào logic tính điểm chớp mắt nông (Incomplete Blink Ratio).
*   **[ Quyền riêng tư (Privacy Policy)](./docs/PRIVACY.md)**: Cam kết bảo mật, cam kết "Zero-Store" và xử lý 100% trên thiết bị (On-Device).
*   **[ Hướng dẫn Demo & Kiểm thử (Testing)](./docs/TESTING.md)**: Các **phím tắt bí mật (D, S, E)** cho ban giám khảo và kịch bản demo tính năng.

---

## Danh sách Tính năng Đầy đủ (Full Feature List)

### 🩺 Chẩn đoán Sức khỏe Mắt (Eye Checkup)
Quy trình chẩn đoán 2 giai đoạn duy nhất giúp đánh giá nguy cơ mỏi mắt:
*   **AI Chatbot Khảo sát**: Đánh giá thói quen làm việc và triệu chứng qua hội thoại tự nhiên.
*   **Camera Assessment (45s)**: Đo lường thực tế tần suất chớp mắt (BPM) và tỷ lệ chớp mắt lỗi (Incomplete Blink Ratio).
*   **Fusion Engine**: Kết hợp dữ liệu Survey và Camera để đưa ra cấp độ nguy cơ (Low/Medium/High) và lời khuyên y tế cá nhân hóa.

### 🛡️ Trợ lý Làm việc Thông minh (Work Companion)
Hệ thống bảo vệ "âm thầm" nhưng hiệu quả:
*   **Smart Focus Score (0-100)**: Điểm số sức khỏe được cập nhật theo thời gian thực dựa trên chất lượng chớp mắt và khoảng cách ngồi.
*   **Adaptive 20-20-20 Rule**: Nếu điểm sức khỏe (Score) tốt, hệ thống bỏ qua lần báo nghỉ để bảo vệ sự tập trung (Deep Work). Chỉ nhắc nhở khi mỏi mắt hoặc ngồi sai tư thế nhiều.
*   **Adaptive Frequency v3**: Tự động giãn cách tần suất quét Camera khi người dùng ngồi đúng để không gây khó chịu.

###  Chế độ Hiển thị & Bảo vệ (Display Profiles)
Thay đổi cấu hình màn hình chỉ bằng 1 cú click:
*   **Reading Mode**: Tối ưu độ tương phản cho việc đọc tài liệu.
*   **Comfort Mode**: Cân bằng màu sắc cho trải nghiệm hình ảnh mượt mà.
*   **Health Mode**: Giảm tối đa ánh sáng xanh và nhiệt độ màu ấm.
*   **Edge Lighting**: Hiệu ứng ánh sáng viền màn hình báo hiệu trạng thái (Nghỉ/Làm việc/Cảnh báo) cực kỳ tinh tế.

###  Gamification & Thống kê (Gamification & Stats)
*   **Achievements & Badges**: Hệ thống huy hiệu (Eagle Eye, Zen Master, Consistency) khuyến khích thói quen tốt.
*   **Smart Streak**: Theo dõi chuỗi ngày làm việc lành mạnh.
*   **Health Dashboard**: Biểu đồ lịch sử mệt mỏi mắt, thời gian tập trung và số lần chớp mắt hàng ngày.

---

##  Công nghệ Sử dụng
- **Core**: Electron.js, Vite, TypeScript.
- **AI**: MediaPipe Face Landmarker, ONNX Runtime.
- **Data**: IndexedDB (Dexie.js) - Lưu trữ 100% cục bộ.

---

##  Cài đặt & Khởi chạy nhanh
1. `npm install`
2. `npm run dev` (Web) hoặc `npm run electron:dev` (Desktop)

---
*Bảo vệ đôi mắt của bạn bắt đầu từ hôm nay với DryEyeGuard!*
