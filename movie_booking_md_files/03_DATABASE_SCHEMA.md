# SQLite Database Schema

## 1. Database Purpose
The database stores movies, cinemas, screens, seats, showtimes, customers, bookings, and booking seats.

## 2. Tables

### movies
```sql
CREATE TABLE movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    poster_url TEXT,
    backdrop_url TEXT,
    genre TEXT,
    duration_minutes INTEGER,
    age_rating TEXT,
    release_date TEXT,
    status TEXT DEFAULT 'now_showing',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### cinemas
```sql
CREATE TABLE cinemas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    status TEXT DEFAULT 'active'
);
```

### screens
```sql
CREATE TABLE screens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cinema_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    total_seats INTEGER DEFAULT 0,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id)
);
```

### seats
```sql
CREATE TABLE seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    screen_id INTEGER NOT NULL,
    seat_code TEXT NOT NULL,
    row_name TEXT NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_type TEXT DEFAULT 'standard',
    price_multiplier REAL DEFAULT 1,
    FOREIGN KEY (screen_id) REFERENCES screens(id)
);
```

### showtimes
```sql
CREATE TABLE showtimes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    screen_id INTEGER NOT NULL,
    show_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    base_price REAL NOT NULL,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (screen_id) REFERENCES screens(id)
);
```

### customers
```sql
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### bookings
```sql
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_code TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    showtime_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'confirmed',
    payment_status TEXT DEFAULT 'unpaid',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id)
);
```

### booking_seats
```sql
CREATE TABLE booking_seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    seat_id INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (seat_id) REFERENCES seats(id)
);
```

## 3. Important Business Rules
- A seat can be booked only once for a specific showtime.
- Before creating a booking, check whether selected seats are already booked.
- Booking code must be unique.
- Total amount = sum of selected seat prices.
- VIP seats can have a higher price multiplier.
- Disabled/cancelled showtimes cannot receive new bookings.
- Cancelled bookings should release their seats.

## 4. Recommended Indexes
```sql
CREATE INDEX idx_showtimes_movie_date
ON showtimes(movie_id, show_date);

CREATE INDEX idx_booking_showtime
ON bookings(showtime_id);

CREATE INDEX idx_booking_seats_booking
ON booking_seats(booking_id);

CREATE INDEX idx_seats_screen
ON seats(screen_id);
```

## 5. Seed Data
Create demo data for:
- At least 8 movies.
- At least 3 cinemas.
- At least 3 screens.
- At least 60 seats per screen.
- Showtimes across at least 7 days.
- Several sample bookings.

Use realistic Vietnamese movie/cinema information, but clearly label it as demo data.
