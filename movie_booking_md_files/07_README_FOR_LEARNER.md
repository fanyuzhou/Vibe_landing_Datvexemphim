# Movie Booking — Learning Guide

## 1. Goal
This project is a Vibe Coding exercise for learning how to turn a product specification into a working website.

The project has two experiences:

### Customer
A user can browse movies and book seats.

### Admin
An administrator can manage movies, showtimes, cinemas, seats, and bookings.

## 2. Important Architecture Lesson
There is an important technical limitation:

> HTML + CSS + JavaScript running in a normal browser cannot directly connect to a native SQLite server/database in the same way a backend application can.

Therefore, the project uses SQLite compiled to WebAssembly in the browser.

This is suitable for:
- Learning.
- Prototypes.
- Local demos.
- Single-user applications.

It is NOT suitable by itself for:
- Production multi-user booking.
- Secure authentication.
- Concurrent users.
- Centralized booking inventory.
- Real payment processing.

## 3. Suggested Build Order
1. Build the customer landing page.
2. Add movie cards and filtering.
3. Build movie detail.
4. Build cinema/date/showtime selection.
5. Build seat map.
6. Add SQLite.
7. Connect booking flow to SQLite.
8. Build success page.
9. Build admin login.
10. Build admin dashboard.
11. Add movie CRUD.
12. Add showtime CRUD.
13. Add booking management.
14. Add responsive/mobile improvements.
15. Test the complete flow.

## 4. Vibe Coding Workflow
For each feature:
1. Read the relevant `.md` specification.
2. Ask the coding agent to implement only that feature.
3. Run the application.
4. Test manually.
5. Fix errors.
6. Commit the change.
7. Move to the next feature.

Avoid asking the AI to generate the entire project in one huge step.

## 5. Suggested Prompts
### Build the homepage
"Read `01_PROJECT_REQUIREMENTS.md` and `04_CUSTOMER_PAGE_SPEC.md`. Implement only the customer homepage. Do not implement the booking flow yet."

### Build the database
"Read `03_DATABASE_SCHEMA.md` and implement the SQLite database layer in `js/db.js`. Keep SQL isolated from UI code."

### Build seat selection
"Read `04_CUSTOMER_PAGE_SPEC.md`. Implement the seat-selection component with available, selected, occupied, VIP, and disabled states."

### Build admin
"Read `05_ADMIN_PAGE_SPEC.md`. Implement the admin dashboard and booking management UI. Reuse the existing database layer."

## 6. Production Upgrade Path
If this prototype later becomes a real cinema booking platform, move the database and critical business logic to a backend.

Recommended future architecture:

Browser → Backend API → SQLite/PostgreSQL/MySQL

The backend should handle:
- Authentication.
- Authorization.
- Booking transactions.
- Seat locking.
- Concurrent users.
- Payment.
- Central database.
- Audit logs.

Do not try to solve multi-user concurrent booking only with frontend JavaScript.
