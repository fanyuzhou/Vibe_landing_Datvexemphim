# Project Requirements — Movie Ticket Booking

## 1. Project Overview
Build a responsive movie-ticket booking website consisting of:
- A customer-facing movie booking landing page.
- An admin dashboard for managing movies, showtimes, seats, and bookings.
- Frontend technology: HTML5, CSS3, vanilla JavaScript.
- Database technology: SQLite-compatible database handled entirely in the browser.
- No traditional backend server, API server, Node.js, PHP, Python, Java, or other backend language.

## 2. Important Technical Constraint
A normal web browser cannot directly open and modify a `.sqlite` database using ordinary JavaScript.

Therefore, for the no-backend requirement, use a browser-compatible SQLite engine such as **sql.js (SQLite compiled to WebAssembly)** or an equivalent browser SQLite/WASM solution.

The application should:
1. Load the SQLite database into browser memory.
2. Execute SQL through the WASM SQLite engine.
3. Export/save the modified database when persistence is required.
4. Clearly separate database access code from UI code.

Do not pretend that native SQLite can be directly accessed by standard browser JavaScript.

## 3. Customer Features
- Homepage / movie landing page.
- Featured movies.
- Movie search and filtering.
- Movie detail.
- Showtime selection.
- Cinema/location selection.
- Seat selection.
- Booking summary.
- Customer information form.
- Booking confirmation.
- Booking history using the browser-side database.
- Responsive mobile/tablet/desktop layout.

## 4. Admin Features
- Admin login screen.
- Dashboard.
- Movie management.
- Showtime management.
- Cinema management.
- Seat/layout management.
- Booking management.
- Booking detail.
- Revenue/statistics overview.
- Search, filter, sort, and pagination where useful.

## 5. Booking Flow
Home → Select Movie → Movie Detail → Select Cinema → Select Date → Select Showtime → Select Seats → Customer Information → Confirm Booking → Booking Success.

## 6. UI Direction
Design should feel like a modern cinema platform:
- Dark cinematic background.
- High-contrast typography.
- Large movie posters.
- Clear CTA buttons.
- Strong visual hierarchy.
- Seat map should be visually obvious.
- Booking summary should remain easy to review.
- Admin UI should be clean and dashboard-oriented.

## 7. Non-Goals
Do not implement:
- Real payment gateway.
- Real email/SMS service.
- Server-side authentication.
- Cloud database.
- Backend REST API.
- Real-time multi-user synchronization.

For a demo/prototype, payment can be simulated and booking status can be stored locally.
