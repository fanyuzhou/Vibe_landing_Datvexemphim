# Admin Dashboard Specification

## 1. Admin Login
File: `admin-login.html`

UI:
- Cinema logo.
- Username.
- Password.
- Remember-me checkbox.
- Login button.
- Demo credentials hint.

## 2. Dashboard
File: `admin.html`

### Sidebar
- Dashboard
- Movies
- Cinemas
- Screens & Seats
- Showtimes
- Bookings
- Customers
- Settings
- Logout

### KPI Cards
Show:
- Tổng số phim.
- Tổng số suất chiếu.
- Tổng số booking.
- Doanh thu.

### Charts
Use a lightweight chart library only if needed and loaded via CDN; otherwise create simple charts using HTML/CSS/SVG.

Charts:
- Doanh thu theo ngày.
- Số booking theo ngày.
- Top phim được đặt vé nhiều nhất.

## 3. Movie Management
Admin can:
- View movies.
- Search.
- Filter by status.
- Add movie.
- Edit movie.
- Delete movie.
- Change movie status.

Movie fields:
- Title.
- Description.
- Poster.
- Backdrop.
- Genre.
- Duration.
- Age rating.
- Release date.
- Status.

## 4. Cinema Management
Admin can:
- Add cinema.
- Edit cinema.
- Delete/deactivate cinema.
- Manage address.

## 5. Screen & Seat Management
Admin can:
- Create screen.
- Set seat rows.
- Set seat numbers.
- Set seat type.
- Set price multiplier.
- Disable individual seats.

## 6. Showtime Management
Admin can:
- Add showtime.
- Edit showtime.
- Delete/cancel showtime.
- Filter by date, movie, cinema.

Fields:
- Movie.
- Cinema.
- Screen.
- Date.
- Start time.
- End time.
- Base ticket price.
- Status.

## 7. Booking Management
Table columns:
- Booking code.
- Customer.
- Movie.
- Cinema.
- Showtime.
- Seats.
- Amount.
- Payment status.
- Booking status.
- Created time.
- Actions.

Actions:
- View.
- Confirm.
- Cancel.

Filters:
- Date.
- Movie.
- Cinema.
- Status.
- Payment status.
- Search booking code.

## 8. Booking Detail
Show a complete booking summary in a modal or dedicated page.

Admin should be able to:
- View customer information.
- View selected seats.
- View total amount.
- Change booking status.
- Print booking summary.

## 9. Admin UX
- Desktop-first dashboard.
- Responsive sidebar.
- Clear active navigation state.
- Confirmation modal before destructive actions.
- Toast after successful actions.
- Empty states when there is no data.
- Loading state while database initializes.
