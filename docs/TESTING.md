# 🧪 Hướng dẫn Kiểm thử & Trình diễn (Demo & Testing)

Dành cho ban giám khảo và các nhà phát triển để nhanh chóng trải nghiệm tính năng của DryEyeGuard mà không cần đợi hết các chu kỳ Pomodoro 25 phút.

## 1. Phím tắt Bí mật (Secret Demo Shortcuts) 🎭

Chúng tôi đã tích hợp sẵn các phím tắt bí mật trong code `main.ts` dành riêng cho việc trình diễn tại **Datathon 2025**.

Khi ứng dụng đang mở, hãy nhấn các phím sau (tiếng Anh không dấu):

| Phím tắt | Chức năng (Action) | Mô tả (Description) |
| :--- | :--- | :--- |
| **`D`** | **Forced 20-20-20 Break** | Ngay lập tức kích hoạt thông báo nghỉ ngơi 20-20-20 và hiệu ứng Edge Lighting (Xanh). |
| **`S`** | **Forced Session Stop** | Dừng phiên làm việc hiện tại và hiển thị bảng tổng kết (Session Summary) ngay lập tức. |
| **`E`** | **Forced End-of-Time** | Nhảy vọt tới 1 giây cuối cùng của phiên Pomodoro (để xem hiệu ứng kết thúc). |

## 2. Kịch bản Kiểm thử Tính năng (Test Scenarios) 📝

### 🔍 Kiểm tra Khoảng cách (Distance Check)
1. Bắt đầu phiên làm việc (**Work Companion > Start Focus**).
2. Di chuyển khuôn mặt lại gần webcam (dưới 40cm).
3. Quan sát thanh đo khoảng cách chuyển sang màu **Đỏ (Danger)**.
4. Đợi khoảng 10-15 giây để nhận tin nhắn cảnh báo từ trợ lý AI.

### 👁️ Kiểm tra Chẩn đoán Mắt (Eye Checkup)
1. Chọn phần **Eye Checkup > Bắt đầu kiểm tra**.
2. Hoàn thành một vài câu hỏi khảo sát OSDI.
3. Cho phép truy cập Camera.
4. Hệ thống sẽ hiển thị bài thơ **"Truyền Kiều"** cùng giao diện HUD (Heads-up Display) thời gian thực.
5. Thử nháy mắt chậm hoặc không nháy mắt để xem chỉ số **EAR** và **Blink Rate** thay đổi.

### 💅 Kiểm tra Giao diện (UI/UX)
1. **Dark Mode**: Thử bật/tắt chế độ tối trong **Settings**.
2. **Edge Lighting**: Nhấn nút **"Preview Edge Lighting"** trong phần cài đặt để xem hiệu ứng viền màn hình (không gây xao nhãng).
3. **Statistics**: Sau khi kết thúc 1 phiên, hãy vào tab Statistics để xem biểu đồ sức khỏe được vẽ bởi **Chart.js/D3.js**.

---
*Mọi lỗi (bug) phát sinh trong quá trình kiểm thử, vui lòng báo cáo cho QNSang.*
