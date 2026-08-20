# Antigravity / Vibe Coding Master Prompt

## Role
You are a senior frontend engineer and UI/UX designer.

Build a complete movie-ticket booking demo according to the project specification in this repository.

## Strict Technology Rules
Use only:
- HTML5
- CSS3
- Vanilla JavaScript
- SQLite through a browser-compatible WASM library such as sql.js

Do NOT use:
- React
- Vue
- Angular
- Node.js backend
- PHP
- Python
- Java
- REST API
- Firebase
- Supabase
- server-side code

## Important SQLite Rule
A normal browser cannot directly use a native `.sqlite` file with ordinary JavaScript.

Use a browser-compatible SQLite/WASM approach. Keep all database operations in `js/db.js`.

The application must remain functional as a frontend-only prototype.

## Development Principles
1. Build reusable UI components with semantic HTML.
2. Keep CSS modular and maintainable.
3. Keep JavaScript modular.
4. Avoid inline JavaScript.
5. Avoid duplicated code.
6. Use meaningful variable/function names.
7. Add comments only where they improve maintainability.
8. Validate all user input.
9. Handle empty/error states.
10. Make the interface responsive.
11. Make buttons and interactive controls keyboard accessible.
12. Never expose raw SQL throughout UI files.
13. Keep database logic isolated in the database module.

## Customer Experience
Prioritize this flow:

Home → Movie → Cinema → Date → Showtime → Seats → Customer Info → Confirmation.

The booking experience should feel fast and visually simple.

## Admin Experience
Prioritize:
- Overview.
- Booking management.
- Movie management.
- Showtime management.
- Cinema/screen management.
- Search/filter.
- Clear feedback after every action.

## Visual Style
Create a premium modern cinema aesthetic:
- Dark background.
- Large movie imagery.
- Strong typography.
- High-contrast CTA.
- Rounded cards.
- Subtle shadows.
- Smooth hover/focus transitions.
- Clean responsive spacing.

Do not overuse animations.

## Required Deliverables
Create:
- `index.html`
- `booking.html`
- `success.html`
- `admin-login.html`
- `admin.html`
- CSS files.
- JavaScript files.
- SQLite database initialization/seed logic.
- README with setup instructions.

## Database
Seed realistic demo data:
- 8+ movies.
- 3+ cinemas.
- 3+ screens.
- 60+ seats per screen.
- 7 days of showtimes.
- Sample bookings.

## Booking Logic
Before confirming a booking:
1. Validate customer information.
2. Validate movie/showtime.
3. Validate selected seats.
4. Check occupied seats again in SQLite.
5. Calculate total.
6. Create customer.
7. Create booking.
8. Create booking_seats records.
9. Show confirmation.

If a selected seat has become occupied, stop the booking and ask the user to refresh/reselect seats.

## Admin Logic
All CRUD operations should update the SQLite data and refresh the UI without a page reload where practical.

## Testing Checklist
Verify:
- Movie filtering works.
- Movie detail works.
- Cinema selection works.
- Date selection works.
- Showtime selection works.
- Seat selection works.
- Occupied seats cannot be selected.
- Booking total is correct.
- Booking is stored.
- Booking appears in admin.
- Admin can cancel a booking.
- Cancelled seats become available again.
- Movie CRUD works.
- Showtime CRUD works.
- Responsive layout works.
- Refresh behavior is documented.
- Database import/export works if implemented.

## Final Quality Gate
Before considering the project complete:
- Remove console errors.
- Test all main flows.
- Test empty states.
- Test invalid forms.
- Test duplicate seat booking prevention.
- Test mobile layout.
- Confirm there is no backend code.
- Confirm all database operations are isolated.
