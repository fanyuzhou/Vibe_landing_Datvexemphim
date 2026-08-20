# Technical Architecture

## 1. Technology Stack

### Required
- HTML5
- CSS3
- Vanilla JavaScript ES6+
- SQLite through a browser-compatible WASM library such as sql.js
- Local browser persistence where appropriate

### Forbidden
- React
- Vue
- Angular
- Next.js
- Node.js backend
- Express
- PHP
- Python backend
- Java/Spring
- Firebase backend
- Supabase backend
- MySQL/PostgreSQL server
- REST API
- GraphQL

## 2. Recommended Folder Structure

```text
movie-booking/
├── index.html
├── booking.html
├── success.html
├── admin.html
├── admin-login.html
├── assets/
│   ├── images/
│   └── icons/
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── global.css
│   ├── customer.css
│   └── admin.css
├── js/
│   ├── app.js
│   ├── db.js
│   ├── data.js
│   ├── booking.js
│   ├── seats.js
│   ├── admin.js
│   └── utils.js
├── database/
│   └── movie_booking.sqlite
└── vendor/
    └── sql-wasm/
```

## 3. Architecture Layers

### Presentation
HTML pages and reusable UI components created with semantic HTML.

### Styling
CSS variables, responsive layouts, reusable buttons/cards/forms/modals.

### Application Logic
Vanilla JavaScript modules handle:
- Movie filtering.
- Showtime selection.
- Seat selection.
- Booking calculations.
- Form validation.
- Admin actions.
- UI state.

### Database Layer
`db.js` is the only module responsible for SQLite operations.

Expose functions such as:
- `initDatabase()`
- `getMovies()`
- `getMovieById(id)`
- `getShowtimes(movieId, date)`
- `getSeats(showtimeId)`
- `createBooking(data)`
- `getBookings(filters)`
- `updateBookingStatus(id, status)`
- `deleteMovie(id)`
- `saveDatabase()`

UI files must not contain raw SQL whenever possible.

## 4. Data Persistence
Because there is no backend:
- SQLite data exists in browser memory after initialization.
- Use IndexedDB/local browser storage for persistence of the database file when practical.
- Provide an optional admin action to export the SQLite database.
- Provide an optional admin action to import a SQLite database.
- Explain in the UI that this is a local/demo system and is not multi-user.

## 5. Authentication
Admin authentication is demo-only:
- Store demo admin credentials in local application data.
- Never describe this as production-grade security.
- After login, store a temporary session flag in `sessionStorage`.
- Protect admin pages by checking the session flag.

Example demo account:
- Username: `admin`
- Password: `admin123`

Make it easy to replace demo authentication later with a real backend.

## 6. Responsive Breakpoints
Support:
- Mobile: 320–767px
- Tablet: 768–1023px
- Desktop: 1024px+

Do not create a separate mobile application.

## 7. Accessibility
Use:
- Semantic HTML.
- Visible focus states.
- Keyboard-accessible controls.
- Labels for form fields.
- ARIA only where necessary.
- Sufficient contrast.
- Alt text for movie images.
