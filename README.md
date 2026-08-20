# Ngọc Châu Cinema — Website Đặt Vé Xem Phim Trực Tuyến

Hệ thống Landing Page & Đặt Vé Xem Phim cho **Rạp Chiếu Phim Ngọc Châu Cinema** được thiết kế hiện đại, responsive, không phụ thuộc vào backend server (Frontend-Only Architecture) với cơ sở dữ liệu SQLite chạy trực tiếp trong trình duyệt bằng WebAssembly (SQL.js).

---

## 🌟 Tính Năng Nổi Bật

### 1. Giao diện Khách hàng (Customer Booking Experience)
- **Trang chủ (`index.html`)**:
  - Nhúng Logo **Ngọc Châu Cinema** thiết kế độc quyền.
  - Banner Hero bom tấn điện ảnh góc nhìn sang trọng.
  - Tìm kiếm phim theo tên, bộ lọc theo danh mục **Đang Chiếu** và **Sắp Chiếu**.
  - Modal xem thông tin chi tiết phim, độ tuổi, thời lượng và lịch chiếu khả dụng.
- **Quy trình Đặt vé 5 Bước Trực quan (`booking.html`)**:
  - **Bước 1**: Chọn phim chiếu rạp.
  - **Bước 2**: Chọn cụm rạp, chọn ngày chiếu & suất chiếu.
  - **Bước 3**: Sơ đồ ghế xem phim tương tác 60+ ghế (Ghế Thường, Ghế VIP, Ghế đã bán, Ghế đang chọn).
  - **Bước 4**: Điền thông tin khách hàng nhận vé (Họ tên, SĐT, Email).
  - **Bước 5**: Kiểm tra đơn hàng & Xác nhận đặt vé.
- **Trang Xác nhận Đặt vé Thành công (`success.html`)**:
  - Tạo **Mã vé (Booking Code)** duy nhất (ví dụ: `NCC-8F92A`).
  - Hiển thị vé điện tử mô phỏng chi tiết đầy đủ thông tin rạp, suất chiếu, vị trí ghế và số tiền.

### 2. Trang Quản trị (Admin Dashboard Experience)
- **Đăng nhập Quản trị (`admin-login.html`)**:
  - Bảo mật bằng SessionStorage.
  - Tài khoản demo: `admin` / `admin123`.
- **Bảng Quản trị (`admin.html`)**:
  - **KPI Stats**: Tổng số phim, suất chiếu, tổng đơn hàng & tổng doanh thu.
  - **Quản lý Phim**: Thêm phim mới, xóa phim, lọc theo trạng thái.
  - **Quản lý Suất chiếu**: Xem danh sách suất chiếu của từng phim theo rạp và thời gian.
  - **Quản lý Đơn đặt vé**: Xem đơn vé của khách hàng, xử lý Hủy vé (Tự động giải phóng ghế đã đặt).
  - **Quản lý Cụm rạp & Phòng**: Thống kê danh sách cụm rạp Ngọc Châu Cinema.

---

## 🏗️ Cấu Trúc Thư Mục Dự Án

```text
Vibe_landing_Datvexemphim/
├── index.html            # Trang chủ Khách hàng
├── booking.html          # Trang Quy trình Đặt vé 5 bước
├── success.html          # Trang Xác nhận Đặt vé Thành công
├── admin-login.html      # Trang Đăng nhập Quản trị viên
├── admin.html            # Trang Bảng điều khiển Admin Dashboard
├── logo/
│   ├── logo.jpg          # Logo Ngọc Châu Cinema
│   └── ngoc_chau_cinema_logo.jpg
├── css/
│   ├── reset.css         # Normalize & CSS Reset
│   ├── variables.css     # Biến màu sắc, Typography, Shadows
│   ├── global.css        # Layout Navbar, Footer, Buttons, Modals
│   ├── customer.css      # Style trang chủ, phim, sơ đồ ghế, booking
│   └── admin.css         # Style Admin Dashboard, tables, KPI cards
├── js/
│   ├── utils.js          # Helper định dạng tiền VND, Ngày giờ, Toast
│   ├── db.js             # Động cơ SQLite Browser via SQL.js WASM
│   ├── app.js            # Controller cho Trang chủ Khách hàng
│   ├── seats.js          # Renderer sơ đồ ghế tương tác & tính tiền
│   ├── booking.js        # Điều hướng 5 bước đặt vé & tạo đơn
│   └── admin.js          # Xử lý CRUD Admin & Thống kê KPI
└── README.md             # Hướng dẫn dự án
```

---

## 💻 Khởi Chạy Dự Án

1. Mở file `index.html` trực tiếp trong trình duyệt web bất kỳ (Chrome, Edge, Firefox, Safari).
2. Hoặc sử dụng extension **Live Server** (VS Code) để chạy server tĩnh tại địa chỉ `http://127.0.0.1:5500`.

---

## 🔐 Tài Khoản Admin Demo
- **Username**: `admin`
- **Password**: `admin123`
