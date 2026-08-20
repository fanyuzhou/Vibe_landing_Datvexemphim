# Customer Booking Page Specification

## 1. Main Page
File: `index.html`

### Header
- Cinema logo/name.
- Navigation:
  - Trang chủ
  - Phim đang chiếu
  - Lịch chiếu
  - Khuyến mãi
  - Liên hệ
- Search icon/input.
- Mobile hamburger menu.

### Hero
Include:
- Large cinematic background.
- Main headline.
- Short supporting text.
- Primary CTA: `Đặt vé ngay`.
- Secondary CTA: `Xem phim đang chiếu`.

### Movie Section
Show movie cards containing:
- Poster.
- Title.
- Genre.
- Duration.
- Age rating.
- Release date.
- CTA `Đặt vé`.

Filters:
- Đang chiếu.
- Sắp chiếu.
- Thể loại.
- Ngày chiếu.

## 2. Movie Detail
Show:
- Backdrop.
- Poster.
- Movie title.
- Rating/age label.
- Duration.
- Genre.
- Description.
- Release date.
- Available showtimes.

## 3. Booking UI

### Step 1 — Cinema
Show cinema cards with address.

### Step 2 — Date
Horizontal date selector.

### Step 3 — Showtime
Show available times grouped by cinema/screen.

### Step 4 — Seat Map
Create a cinema seat map using HTML/CSS/JavaScript.

Seat states:
- Available
- Selected
- Occupied
- VIP
- Disabled

Do not use images for seats; build the seat map with HTML/CSS.

### Step 5 — Customer Information
Fields:
- Họ và tên
- Email
- Số điện thoại

Validation:
- Name required.
- Phone required.
- Email format validation if provided.

### Step 6 — Booking Summary
Show:
- Movie.
- Cinema.
- Date.
- Showtime.
- Selected seats.
- Ticket quantity.
- Price per seat.
- Total amount.

CTA:
`Xác nhận đặt vé`

## 4. Success Page
Show:
- Success message.
- Booking code.
- Movie.
- Cinema.
- Showtime.
- Seats.
- Total.
- Customer information.
- Button `Về trang chủ`.
- Button `Đặt vé khác`.

## 5. UX Requirements
- Keep booking steps visually clear.
- Disable the next step until the current step is completed.
- Always show selected-seat count and total price.
- Warn users before losing selected seats.
- Use modal/toast feedback for errors and confirmations.
- Never allow users to select occupied seats.
