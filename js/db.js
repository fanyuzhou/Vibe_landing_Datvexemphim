/**
 * Database Module (SQLite in Browser via SQL.js & RBAC Multi-Role Support) — Ngọc Châu Cinema
 */

const DB = {
  db: null,
  isInitialized: false,
  STORAGE_KEY: 'ngoc_chau_cinema_sqlite_db',

  async init() {
    if (this.isInitialized) return this;

    try {
      if (window.initSqlJs) {
        const SQL = await window.initSqlJs({
          locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        const savedData = localStorage.getItem(this.STORAGE_KEY);
        if (savedData) {
          const uInt8Array = new Uint8Array(JSON.parse(savedData));
          this.db = new SQL.Database(uInt8Array);
          this.ensureFoodAndPromotionsSeeded();
          this.ensureTenNewMoviesSeeded();
          this.ensureTenNewShowtimesSeeded();
          this.ensureUsersAndApprovalsSeeded();
        } else {
          this.db = new SQL.Database();
          this.createTables();
          this.seedData();
          this.save();
        }
      } else {
        console.warn("sql.js WASM not loaded, using LocalStorage fallback mode.");
        this.initFallbackDB();
      }
    } catch (e) {
      console.warn("SQL.js initialization error, falling back to LocalStorage JSON storage:", e);
      this.initFallbackDB();
    }

    this.isInitialized = true;
    console.log("Database initialized successfully!");
    return this;
  },

  save() {
    if (this.db && this.db.export) {
      const data = this.db.export();
      const array = Array.from(data);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(array));
    }
  },

  ensureFoodAndPromotionsSeeded() {
    this.createTables();
    this.ensureBookingsSchemaUpToDate();

    try {
      const res = this.db.exec(`SELECT COUNT(*) FROM food_items`);
      const count = (res.length && res[0].values.length) ? res[0].values[0][0] : 0;
      if (count === 0) {
        this.seedFoodAndPromotions();
      }
    } catch (e) {
      this.seedFoodAndPromotions();
    }
  },

  ensureBookingsSchemaUpToDate() {
    if (!this.db) return;
    try {
      const info = this.db.exec(`PRAGMA table_info(bookings)`);
      if (info.length && info[0].values.length) {
        const columns = info[0].values.map(col => col[1]);
        const requiredCols = [
          { name: 'ticket_amount', sql: 'ALTER TABLE bookings ADD COLUMN ticket_amount REAL DEFAULT 0' },
          { name: 'food_amount', sql: 'ALTER TABLE bookings ADD COLUMN food_amount REAL DEFAULT 0' },
          { name: 'discount_amount', sql: 'ALTER TABLE bookings ADD COLUMN discount_amount REAL DEFAULT 0' },
          { name: 'discount_code', sql: 'ALTER TABLE bookings ADD COLUMN discount_code TEXT' },
          { name: 'food_details', sql: 'ALTER TABLE bookings ADD COLUMN food_details TEXT' },
          { name: 'payment_method', sql: "ALTER TABLE bookings ADD COLUMN payment_method TEXT DEFAULT 'momo'" },
          { name: 'payment_status', sql: "ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'paid'" }
        ];

        requiredCols.forEach(c => {
          if (!columns.includes(c.name)) {
            try {
              this.db.run(c.sql);
            } catch (err) {}
          }
        });
        this.save();
      }
    } catch (e) {}
  },

  ensureUsersAndApprovalsSeeded() {
    if (!this.db) return;

    // Check & Add approval_status column to movies
    try {
      const movieInfo = this.db.exec(`PRAGMA table_info(movies)`);
      if (movieInfo.length && movieInfo[0].values.length) {
        const cols = movieInfo[0].values.map(c => c[1]);
        if (!cols.includes('approval_status')) {
          this.db.run(`ALTER TABLE movies ADD COLUMN approval_status TEXT DEFAULT 'approved'`);
        }
      }
    } catch (e) {}

    // Check & Add approval_status column to showtimes
    try {
      const stInfo = this.db.exec(`PRAGMA table_info(showtimes)`);
      if (stInfo.length && stInfo[0].values.length) {
        const cols = stInfo[0].values.map(c => c[1]);
        if (!cols.includes('approval_status')) {
          this.db.run(`ALTER TABLE showtimes ADD COLUMN approval_status TEXT DEFAULT 'approved'`);
        }
      }
    } catch (e) {}

    // Check users table exists and seed default accounts
    try {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          status TEXT DEFAULT 'active',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const countRes = this.db.exec(`SELECT COUNT(*) FROM users`);
      const userCount = (countRes.length && countRes[0].values.length) ? countRes[0].values[0][0] : 0;
      if (userCount < 14) {
        this.seedUsers();
      }
    } catch (e) {
      console.warn("Error ensuring users table:", e);
    }

    this.save();
  },

  seedUsers() {
    const defaultAccounts = [
      // ADMIN (1 account)
      { name: "Quản Trị Viên Hệ Thống", email: "admin@demo.com", phone: "0900000000", pass: "admin123", role: "admin" },
      { name: "Quản Trị Admin", email: "admin", phone: "0900000001", pass: "admin123", role: "admin" },

      // USER (5 accounts)
      { name: "Khách Hàng User 1", email: "user1@demo.com", phone: "0911000001", pass: "123456", role: "user" },
      { name: "Khách Hàng User 2", email: "user2@demo.com", phone: "0911000002", pass: "123456", role: "user" },
      { name: "Khách Hàng User 3", email: "user3@demo.com", phone: "0911000003", pass: "123456", role: "user" },
      { name: "Khách Hàng User 4", email: "user4@demo.com", phone: "0911000004", pass: "123456", role: "user" },
      { name: "Khách Hàng User 5", email: "user5@demo.com", phone: "0911000005", pass: "123456", role: "user" },

      // STAFF (5 accounts)
      { name: "Nhân Viên Staff 1", email: "staff1@demo.com", phone: "0922000001", pass: "123456", role: "staff" },
      { name: "Nhân Viên Staff 2", email: "staff2@demo.com", phone: "0922000002", pass: "123456", role: "staff" },
      { name: "Nhân Viên Staff 3", email: "staff3@demo.com", phone: "0922000003", pass: "123456", role: "staff" },
      { name: "Nhân Viên Staff 4", email: "staff4@demo.com", phone: "0922000004", pass: "123456", role: "staff" },
      { name: "Nhân Viên Staff 5", email: "staff5@demo.com", phone: "0922000005", pass: "123456", role: "staff" },

      // NHÀ TÀI TRỢ / SPONSOR (3 accounts)
      { name: "Nhà Tài Trợ NTT 1", email: "ntt1@demo.com", phone: "0933000001", pass: "123456", role: "sponsor" },
      { name: "Nhà Tài Trợ NTT 2", email: "ntt2@demo.com", phone: "0933000002", pass: "123456", role: "sponsor" },
      { name: "Nhà Tài Trợ NTT 3", email: "ntt3@demo.com", phone: "0933000003", pass: "123456", role: "sponsor" }
    ];

    defaultAccounts.forEach(acc => {
      try {
        this.db.run(
          `INSERT OR REPLACE INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
          [acc.name, acc.email, acc.phone, acc.pass, acc.role]
        );
      } catch (e) {}
    });

    this.save();
  },

  authenticateUser(emailOrUsername, password) {
    if (!this.db) return null;
    this.ensureUsersAndApprovalsSeeded();

    const cleanInput = (emailOrUsername || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const sql = `SELECT * FROM users WHERE LOWER(email) = '${cleanInput}' AND password = '${cleanPass}'`;
    const res = this.db.exec(sql);
    if (res.length && res[0].values.length) {
      return this.mapRows(res[0])[0];
    }
    return null;
  },

  ensureTenNewMoviesSeeded() {
    if (!this.db) return;
    try {
      const res = this.db.exec(`SELECT COUNT(*) FROM movies WHERE slug = 'deadpool-and-wolverine'`);
      if (!res.length || !res[0].values[0][0]) {
        this.seedTenNewMovies();
      }
    } catch (e) {
      this.seedTenNewMovies();
    }
  },

  seedTenNewMovies() {
    const newMovies = [
      { title: "Deadpool & Wolverine", slug: "deadpool-and-wolverine", description: "Deadpool và Wolverine hợp sức trong trận chiến bảo vệ đa vũ trụ Marvel.", poster_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop", genre: "Hành động, Hài hước", duration_minutes: 127, age_rating: "T18", release_date: "2026-07-26", status: "now_showing" },
      { title: "Inside Out 2 (Những Mảnh Ghép Cảm Xúc 2)", slug: "inside-out-2", description: "Riley bước vào tuổi dậy thì với sự xuất hiện của những cảm xúc mới: Lo Âu, Ghen Tị.", poster_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop", genre: "Hoạt hình, Gia đình", duration_minutes: 96, age_rating: "P", release_date: "2026-06-14", status: "now_showing" },
      { title: "Despicable Me 4 (Kẻ Trộm Mặt Trăng 4)", slug: "despicable-me-4", description: "Gru và gia đình đón chào thành viên mới Gru Jr. cùng đội quân Minions quậy phá.", poster_url: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1200&auto=format&fit=crop", genre: "Hoạt hình, Hài hước", duration_minutes: 94, age_rating: "P", release_date: "2026-07-03", status: "now_showing" },
      { title: "A Quiet Place: Day One (Vùng Đất Câm Lặng: Ngày Một)", slug: "a-quiet-place-day-one", description: "Khám phá ngày đầu tiên khi những sinh vật tàn bạo giáng xuống New York.", poster_url: "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=1200&auto=format&fit=crop", genre: "Kinh dị, Giật gân", duration_minutes: 100, age_rating: "T16", release_date: "2026-06-28", status: "now_showing" },
      { title: "Furiosa: A Mad Max Saga", slug: "furiosa", description: "Hành trình thời trẻ của nữ chiến binh Furiosa vượt qua vùng đất hoang tàn.", poster_url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop", genre: "Hành động, Phiêu lưu", duration_minutes: 148, age_rating: "T18", release_date: "2026-05-24", status: "now_showing" },
      { title: "Kingdom of the Planet of the Apes (Hành Tinh Khỉ: Vương Quốc Mới)", slug: "kingdom-of-the-planet-of-the-apes", description: "Nhiều thế hệ sau triều đại của Caesar, một chú khỉ trẻ bắt đầu hành trình gian nan.", poster_url: "https://images.unsplash.com/photo-1568876694728-451bbf694b83?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1568876694728-451bbf694b83?q=80&w=1200&auto=format&fit=crop", genre: "Hành động, Viễn tưởng", duration_minutes: 145, age_rating: "T13", release_date: "2026-05-10", status: "now_showing" },
      { title: "Alien: Romulus", slug: "alien-romulus", description: "Một nhóm bạn trẻ dọn dẹp trạm vũ trụ bỏ hoang và đối mặt sinh vật quái dị ngoài hành tinh.", poster_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop", genre: "Kinh dị, Viễn tưởng", duration_minutes: 119, age_rating: "T18", release_date: "2026-08-16", status: "coming_soon" },
      { title: "Gladiator II (Võ Sĩ Giác Đấu 2)", slug: "gladiator-2", description: "Lucius bước vào đấu trường La Mã huyền thoại để phục thù và tìm lại danh dự gia tộc.", poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop", genre: "Hành động, Lịch sử", duration_minutes: 150, age_rating: "T18", release_date: "2026-11-22", status: "coming_soon" },
      { title: "Joker: Folie à Deux", slug: "joker-folie-a-deux", description: "Cuộc gặp gỡ định mệnh giữa Arthur Fleck và Harley Quinn tại trại tâm thần Arkham.", poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop", genre: "Tâm lý, Nhạc kịch", duration_minutes: 138, age_rating: "T18", release_date: "2026-10-04", status: "coming_soon" },
      { title: "Moana 2 (Hành Trình Của Moana 2)", slug: "moana-2", description: "Moana và Maui giăng buồm thực hiện chuyến hải trình mới đến những vùng biển xa xôi.", poster_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200&auto=format&fit=crop", genre: "Hoạt hình, Phiêu lưu", duration_minutes: 100, age_rating: "P", release_date: "2026-11-27", status: "coming_soon" }
    ];

    newMovies.forEach(m => {
      try {
        this.db.run(
          `INSERT INTO movies (title, slug, description, poster_url, backdrop_url, genre, duration_minutes, age_rating, release_date, status, approval_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
          [m.title, m.slug, m.description, m.poster_url, m.backdrop_url, m.genre, m.duration_minutes, m.age_rating, m.release_date, m.status]
        );
      } catch (e) {}
    });

    this.save();
  },

  ensureTenNewShowtimesSeeded() {
    if (!this.db) return;
    try {
      const res = this.db.exec(`SELECT COUNT(*) FROM showtimes`);
      const count = (res.length && res[0].values.length) ? res[0].values[0][0] : 0;
      if (count < 70) {
        const today = new Date();
        const newTimes = [
          { movie_id: 7, screen_id: 1, start_time: "10:15", price: 120000, days: 1 },
          { movie_id: 7, screen_id: 2, start_time: "14:45", price: 120000, days: 1 },
          { movie_id: 8, screen_id: 3, start_time: "11:00", price: 110000, days: 2 },
          { movie_id: 8, screen_id: 4, start_time: "16:20", price: 110000, days: 2 },
          { movie_id: 9, screen_id: 1, start_time: "13:30", price: 110000, days: 3 },
          { movie_id: 9, screen_id: 3, start_time: "19:15", price: 110000, days: 3 },
          { movie_id: 10, screen_id: 2, start_time: "15:10", price: 110000, days: 4 },
          { movie_id: 10, screen_id: 4, start_time: "20:30", price: 110000, days: 4 },
          { movie_id: 11, screen_id: 1, start_time: "17:00", price: 130000, days: 5 },
          { movie_id: 12, screen_id: 3, start_time: "21:45", price: 130000, days: 5 }
        ];

        newTimes.forEach(st => {
          const d = new Date();
          d.setDate(today.getDate() + st.days);
          const dateStr = d.toISOString().split('T')[0];
          try {
            this.db.run(
              `INSERT INTO showtimes (movie_id, screen_id, show_date, start_time, end_time, base_price, status, approval_status)
               VALUES (?, ?, ?, ?, '2 tiếng', ?, 'active', 'approved')`,
              [st.movie_id, st.screen_id, dateStr, st.start_time, st.price]
            );
          } catch (e) {}
        });
        this.save();
      }
    } catch (e) {}
  },

  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS movies (
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
        approval_status TEXT DEFAULT 'approved',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cinemas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        status TEXT DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS screens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cinema_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        total_seats INTEGER DEFAULT 60,
        FOREIGN KEY (cinema_id) REFERENCES cinemas(id)
      );

      CREATE TABLE IF NOT EXISTS seats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        screen_id INTEGER NOT NULL,
        seat_code TEXT NOT NULL,
        row_name TEXT NOT NULL,
        seat_number INTEGER NOT NULL,
        seat_type TEXT DEFAULT 'standard',
        price_multiplier REAL DEFAULT 1.0,
        FOREIGN KEY (screen_id) REFERENCES screens(id)
      );

      CREATE TABLE IF NOT EXISTS showtimes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL,
        screen_id INTEGER NOT NULL,
        show_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        base_price REAL NOT NULL,
        status TEXT DEFAULT 'active',
        approval_status TEXT DEFAULT 'approved',
        FOREIGN KEY (movie_id) REFERENCES movies(id),
        FOREIGN KEY (screen_id) REFERENCES screens(id)
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        password TEXT DEFAULT '123456',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS food_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT DEFAULT 'combo',
        image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        min_order_amount REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_code TEXT UNIQUE NOT NULL,
        customer_id INTEGER NOT NULL,
        showtime_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        ticket_amount REAL DEFAULT 0,
        food_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        discount_code TEXT,
        food_details TEXT,
        payment_method TEXT DEFAULT 'momo',
        status TEXT DEFAULT 'confirmed',
        payment_status TEXT DEFAULT 'paid',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (showtime_id) REFERENCES showtimes(id)
      );

      CREATE TABLE IF NOT EXISTS booking_seats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        seat_id INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (seat_id) REFERENCES seats(id)
      );
    `);
  },

  seedFoodAndPromotions() {
    const foods = [
      { name: "Combo Solo Bắp Nước", description: "1 Bắp ngọt lớn (60oz) + 1 Nước ngọt lớn (32oz)", price: 89000, category: "combo", image_url: "🍿" },
      { name: "Combo Couple Bắp Nước", description: "1 Bắp ngọt lớn (60oz) + 2 Nước ngọt lớn (32oz)", price: 119000, category: "combo", image_url: "🍿🥤" },
      { name: "Combo Party Ngọc Châu", description: "2 Bắp bơ phô mai lớn + 2 Nước lớn + 1 Snack khoai tây", price: 159000, category: "combo", image_url: "🍿🥤🍟" },
      { name: "Bắp Rang Phô Mai (L)", description: "Bắp rang giòn rụm phủ lớp bột phô mai béo ngậy", price: 59000, category: "popcorn", image_url: "🧀" },
      { name: "Bắp Rang Bơ Caramel (L)", description: "Bắp rang ngọt ngào bọc lớp bơ caramel thơm lừng", price: 55000, category: "popcorn", image_url: "🍯" },
      { name: "Nước Ngọt Pepsi / Coca (L)", description: "Nước ngọt có gas 32oz ướp lạnh sảng khoái", price: 35000, category: "drink", image_url: "🥤" }
    ];

    foods.forEach(f => {
      this.db.run(
        `INSERT INTO food_items (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)`,
        [f.name, f.description, f.price, f.category, f.image_url]
      );
    });

    const promos = [
      { code: "NGOCCHAU10", description: "Giảm 10% tổng đơn đặt vé & bắp nước", discount_type: "percentage", discount_value: 10, min_order_amount: 0 },
      { code: "VIPCINEMA20", description: "Ưu đãi thành viên VIP giảm 20%", discount_type: "percentage", discount_value: 20, min_order_amount: 100000 },
      { code: "TIETKIEM50K", description: "Giảm trực tiếp 50.000 ₫ cho đơn từ 150.000 ₫", discount_type: "fixed", discount_value: 50000, min_order_amount: 150000 }
    ];

    promos.forEach(p => {
      try {
        this.db.run(
          `INSERT INTO promotions (code, description, discount_type, discount_value, min_order_amount) VALUES (?, ?, ?, ?, ?)`,
          [p.code, p.description, p.discount_type, p.discount_value, p.min_order_amount]
        );
      } catch (e) {}
    });

    this.save();
  },

  seedData() {
    const movies = [
      { title: "Mai", slug: "mai", description: "Câu chuyện cảm động về cuộc đời của Mai...", poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop", genre: "Tâm lý, Tình cảm", duration_minutes: 131, age_rating: "T18", release_date: "2026-02-10", status: "now_showing" },
      { title: "Lật Mặt 7: Một Điều Ước", slug: "lat-mat-7", description: "Hành trình tình thân đầy xúc động...", poster_url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=1200&auto=format&fit=crop", genre: "Gia đình, Tâm lý", duration_minutes: 138, age_rating: "K", release_date: "2026-04-26", status: "now_showing" },
      { title: "Dune: Hành Tinh Cát 2", slug: "dune-2", description: "Paul Atreides hợp lực cùng Chani...", poster_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop", genre: "Hành động, Viễn tưởng", duration_minutes: 166, age_rating: "T16", release_date: "2026-03-01", status: "now_showing" },
      { title: "Godzilla x Kong: Đế Chế Mới", slug: "godzilla-x-kong", description: "Hai đại quái thú huyền thoại hợp lực...", poster_url: "https://images.unsplash.com/photo-1568876694728-451bbf694b83?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop", genre: "Hành động, Quái thú", duration_minutes: 115, age_rating: "T13", release_date: "2026-03-29", status: "now_showing" },
      { title: "Kung Fu Panda 4", slug: "kung-fu-panda-4", description: "Po phải tìm kiếm và huấn luyện...", poster_url: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200&auto=format&fit=crop", genre: "Hoạt hình, Hài hước", duration_minutes: 94, age_rating: "P", release_date: "2026-03-08", status: "now_showing" },
      { title: "Exhuma: Quật Mộ Trùng Ma", slug: "exhuma", description: "Hai thầy phong thủy và pháp sư...", poster_url: "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=600&auto=format&fit=crop", backdrop_url: "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?q=80&w=1200&auto=format&fit=crop", genre: "Kinh dị, Bí ẩn", duration_minutes: 134, age_rating: "T18", release_date: "2026-03-15", status: "now_showing" }
    ];

    movies.forEach(m => {
      this.db.run(
        `INSERT INTO movies (title, slug, description, poster_url, backdrop_url, genre, duration_minutes, age_rating, release_date, status, approval_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
        [m.title, m.slug, m.description, m.poster_url, m.backdrop_url, m.genre, m.duration_minutes, m.age_rating, m.release_date, m.status]
      );
    });

    const cinemas = [
      { name: "Ngọc Châu Cinema Quận 1", address: "135 Nguyễn Huệ, Phường Bến Nghé, Quận 1", city: "TP. Hồ Chí Minh" },
      { name: "Ngọc Châu Cinema Thủ Đức", address: "216 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức", city: "TP. Hồ Chí Minh" },
      { name: "Ngọc Châu Cinema Cầu Giấy", address: "241 Xuân Thủy, Q. Cầu Giấy", city: "Hà Nội" }
    ];

    cinemas.forEach(c => {
      this.db.run(`INSERT INTO cinemas (name, address, city) VALUES (?, ?, ?)`, [c.name, c.address, c.city]);
    });

    const screens = [
      { cinema_id: 1, name: "Phòng 01 - IMAX 3D", total_seats: 60 },
      { cinema_id: 1, name: "Phòng 02 - VIP Studio", total_seats: 60 },
      { cinema_id: 2, name: "Phòng 01 - Dolby Atmos", total_seats: 60 },
      { cinema_id: 3, name: "Phòng 01 - Premium 4K", total_seats: 60 }
    ];

    screens.forEach(s => {
      this.db.run(`INSERT INTO screens (cinema_id, name, total_seats) VALUES (?, ?, ?)`, [s.cinema_id, s.name, s.total_seats]);
    });

    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let screenId = 1; screenId <= 4; screenId++) {
      rows.forEach(r => {
        for (let num = 1; num <= 10; num++) {
          const isVip = (r === 'C' || r === 'D' || r === 'E') && (num >= 3 && num <= 8);
          const seatCode = `${r}${num}`;
          const seatType = isVip ? 'vip' : 'standard';
          const multiplier = isVip ? 1.3 : 1.0;

          this.db.run(
            `INSERT INTO seats (screen_id, seat_code, row_name, seat_number, seat_type, price_multiplier)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [screenId, seatCode, r, num, seatType, multiplier]
          );
        }
      });
    }

    const today = new Date();
    const times = ["09:30", "12:15", "15:00", "18:30", "21:00"];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const showDate = new Date(today);
      showDate.setDate(today.getDate() + dayOffset);
      const dateStr = showDate.toISOString().split('T')[0];

      for (let movieId = 1; movieId <= 6; movieId++) {
        const screenId = ((movieId % 4) + 1);
        const time1 = times[(movieId - 1) % times.length];
        const time2 = times[(movieId + 1) % times.length];
        const price = movieId <= 2 ? 110000 : 100000;

        this.db.run(
          `INSERT INTO showtimes (movie_id, screen_id, show_date, start_time, end_time, base_price, approval_status)
           VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
          [movieId, screenId, dateStr, time1, "2 tiếng", price]
        );
        this.db.run(
          `INSERT INTO showtimes (movie_id, screen_id, show_date, start_time, end_time, base_price, approval_status)
           VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
          [movieId, screenId, dateStr, time2, "2 tiếng", price]
        );
      }
    }

    this.seedFoodAndPromotions();
    this.seedTenNewMovies();
    this.ensureTenNewShowtimesSeeded();
    this.seedUsers();
  },

  // Fallback DB
  initFallbackDB() {
    let data = localStorage.getItem('ngoc_chau_cinema_json_db');
    if (!data) {
      this.fallbackStore = { movies: [], cinemas: [], screens: [], seats: [], showtimes: [], customers: [], bookings: [], booking_seats: [], promotions: [], users: [] };
      localStorage.setItem('ngoc_chau_cinema_json_db', JSON.stringify(this.fallbackStore));
    }
  },

  // --- GETTERS & QUERIES ---

  getMovies(statusFilter = null, includePending = false) {
    if (this.db) {
      this.ensureTenNewMoviesSeeded();
      this.ensureUsersAndApprovalsSeeded();
      this.ensureAllMoviesHaveShowtimes();
      let sql = `SELECT * FROM movies`;
      const conditions = [];

      if (!includePending) {
        conditions.push(`(approval_status = 'approved' OR approval_status IS NULL)`);
      }
      if (statusFilter) {
        conditions.push(`status = '${statusFilter}'`);
      }

      if (conditions.length) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }
      sql += ` ORDER BY id DESC`;
      const res = this.db.exec(sql);
      if (!res.length) return [];
      return this.mapRows(res[0]);
    }
    return [];
  },

  getMovieById(id) {
    if (this.db) {
      const stmt = this.db.prepare(`SELECT * FROM movies WHERE id = ?`);
      stmt.bind([id]);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
    }
    return null;
  },

  addMovie(data, role = 'admin') {
    if (this.db) {
      const slug = Utils.slugify(data.title) + '-' + Date.now().toString().slice(-4);
      const approvalStatus = (role === 'sponsor') ? 'pending_approval' : 'approved';

      this.db.run(
        `INSERT INTO movies (title, slug, description, poster_url, backdrop_url, genre, duration_minutes, age_rating, release_date, status, approval_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.title,
          slug,
          data.description || '',
          data.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
          data.backdrop_url || data.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop',
          data.genre || 'Hành động',
          parseInt(data.duration_minutes || 120),
          data.age_rating || 'P',
          data.release_date || new Date().toISOString().split('T')[0],
          data.status || 'now_showing',
          approvalStatus
        ]
      );

      this.save();
      return approvalStatus;
    }
  },

  updateMovie(id, data, role = 'admin') {
    if (this.db) {
      const approvalStatus = (role === 'sponsor') ? 'pending_approval' : 'approved';
      this.db.run(
        `UPDATE movies 
         SET title = ?, description = ?, poster_url = ?, backdrop_url = ?, genre = ?, duration_minutes = ?, age_rating = ?, release_date = ?, status = ?, approval_status = ?
         WHERE id = ?`,
        [
          data.title,
          data.description || '',
          data.poster_url,
          data.backdrop_url || data.poster_url,
          data.genre,
          parseInt(data.duration_minutes || 120),
          data.age_rating || 'P',
          data.release_date,
          data.status,
          approvalStatus,
          id
        ]
      );
      this.save();
      return approvalStatus;
    }
  },

  deleteMovie(id) {
    if (this.db) {
      this.db.run(`DELETE FROM booking_seats WHERE booking_id IN (SELECT id FROM bookings WHERE showtime_id IN (SELECT id FROM showtimes WHERE movie_id = ?))`, [id]);
      this.db.run(`DELETE FROM bookings WHERE showtime_id IN (SELECT id FROM showtimes WHERE movie_id = ?)`, [id]);
      this.db.run(`DELETE FROM showtimes WHERE movie_id = ?`, [id]);
      this.db.run(`DELETE FROM movies WHERE id = ?`, [id]);
      this.save();
    }
  },

  // --- PROMOTIONS CRUD ---

  getAllPromotions() {
    if (this.db) {
      this.ensureFoodAndPromotionsSeeded();
      const res = this.db.exec(`SELECT * FROM promotions ORDER BY id DESC`);
      if (!res.length) return [];
      return this.mapRows(res[0]);
    }
    return [];
  },

  getPromotionById(id) {
    if (this.db) {
      const stmt = this.db.prepare(`SELECT * FROM promotions WHERE id = ?`);
      stmt.bind([id]);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
    }
    return null;
  },

  addPromotion(data) {
    if (this.db) {
      const cleanCode = (data.code || '').trim().toUpperCase();
      this.db.run(
        `INSERT INTO promotions (code, description, discount_type, discount_value, min_order_amount)
         VALUES (?, ?, ?, ?, ?)`,
        [
          cleanCode,
          data.description || '',
          data.discount_type || 'percentage',
          parseFloat(data.discount_value || 10),
          parseFloat(data.min_order_amount || 0)
        ]
      );
      this.save();
    }
  },

  updatePromotion(id, data) {
    if (this.db) {
      const cleanCode = (data.code || '').trim().toUpperCase();
      this.db.run(
        `UPDATE promotions 
         SET code = ?, description = ?, discount_type = ?, discount_value = ?, min_order_amount = ?
         WHERE id = ?`,
        [
          cleanCode,
          data.description || '',
          data.discount_type || 'percentage',
          parseFloat(data.discount_value || 10),
          parseFloat(data.min_order_amount || 0),
          id
        ]
      );
      this.save();
    }
  },

  deletePromotion(id) {
    if (this.db) {
      this.db.run(`DELETE FROM promotions WHERE id = ?`, [id]);
      this.save();
    }
  },

  // --- USERS & ROLES ---

  getAllUsers() {
    if (this.db) {
      this.ensureUsersAndApprovalsSeeded();
      const res = this.db.exec(`SELECT id, full_name, email, phone, role, status, created_at FROM users ORDER BY role ASC, id ASC`);
      if (!res.length) return [];
      return this.mapRows(res[0]);
    }
    return [];
  },

  getUserById(id) {
    if (this.db) {
      const stmt = this.db.prepare(`SELECT id, full_name, email, phone, password, role, status FROM users WHERE id = ?`);
      stmt.bind([id]);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
    }
    return null;
  },

  addUser(data) {
    if (this.db) {
      this.db.run(
        `INSERT INTO users (full_name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.full_name,
          data.email.trim().toLowerCase(),
          data.phone || '',
          data.password || '123456',
          data.role || 'user',
          data.status || 'active'
        ]
      );
      this.save();
    }
  },

  updateUser(id, data) {
    if (this.db) {
      if (data.password && data.password.trim()) {
        this.db.run(
          `UPDATE users SET full_name = ?, email = ?, phone = ?, password = ?, role = ?, status = ? WHERE id = ?`,
          [data.full_name, data.email.trim().toLowerCase(), data.phone || '', data.password.trim(), data.role, data.status || 'active', id]
        );
      } else {
        this.db.run(
          `UPDATE users SET full_name = ?, email = ?, phone = ?, role = ?, status = ? WHERE id = ?`,
          [data.full_name, data.email.trim().toLowerCase(), data.phone || '', data.role, data.status || 'active', id]
        );
      }
      this.save();
    }
  },

  updateUserRole(id, newRole) {
    if (this.db) {
      this.db.run(`UPDATE users SET role = ? WHERE id = ?`, [newRole, id]);
      this.save();
    }
  },

  deleteUser(id) {
    if (this.db) {
      this.db.run(`DELETE FROM users WHERE id = ?`, [id]);
      this.save();
    }
  },


  // --- APPROVALS SYSTEM ---

  getPendingApprovals() {
    if (!this.db) return { movies: [], showtimes: [] };
    this.ensureUsersAndApprovalsSeeded();

    const pendingMoviesRes = this.db.exec(`SELECT * FROM movies WHERE approval_status = 'pending_approval' ORDER BY id DESC`);
    const pendingMovies = pendingMoviesRes.length ? this.mapRows(pendingMoviesRes[0]) : [];

    const pendingShowtimesRes = this.db.exec(`
      SELECT st.*, m.title as movie_title, c.name as cinema_name, sc.name as screen_name
      FROM showtimes st
      JOIN movies m ON st.movie_id = m.id
      JOIN screens sc ON st.screen_id = sc.id
      JOIN cinemas c ON sc.cinema_id = c.id
      WHERE st.approval_status = 'pending_approval'
      ORDER BY st.id DESC
    `);
    const pendingShowtimes = pendingShowtimesRes.length ? this.mapRows(pendingShowtimesRes[0]) : [];

    return { movies: pendingMovies, showtimes: pendingShowtimes };
  },

  approveMovie(id) {
    if (this.db) {
      this.db.run(`UPDATE movies SET approval_status = 'approved' WHERE id = ?`, [id]);
      this.save();
    }
  },

  rejectMovie(id) {
    if (this.db) {
      this.db.run(`UPDATE movies SET approval_status = 'rejected' WHERE id = ?`, [id]);
      this.save();
    }
  },

  approveShowtime(id) {
    if (this.db) {
      this.db.run(`UPDATE showtimes SET approval_status = 'approved' WHERE id = ?`, [id]);
      this.save();
    }
  },

  rejectShowtime(id) {
    if (this.db) {
      this.db.run(`UPDATE showtimes SET approval_status = 'rejected' WHERE id = ?`, [id]);
      this.save();
    }
  },

  // --- CINEMA CLUSTERS & SCREENS ---

  getCinemas() {
    if (this.db) {
      const res = this.db.exec(`SELECT * FROM cinemas ORDER BY id DESC`);
      if (!res.length) return [];
      return this.mapRows(res[0]);
    }
    return [];
  },

  getCinemaById(id) {
    if (this.db) {
      const stmt = this.db.prepare(`SELECT * FROM cinemas WHERE id = ?`);
      stmt.bind([id]);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
    }
    return null;
  },

  addCinema(data) {
    if (this.db) {
      this.db.run(
        `INSERT INTO cinemas (name, address, city, status) VALUES (?, ?, ?, ?)`,
        [data.name, data.address || '', data.city || 'TP. Hồ Chí Minh', data.status || 'active']
      );

      const cinemaIdRes = this.db.exec(`SELECT last_insert_rowid() as id`);
      const newCinemaId = (cinemaIdRes.length && cinemaIdRes[0].values.length) ? cinemaIdRes[0].values[0][0] : null;

      if (newCinemaId) {
        this.addScreen({ cinema_id: newCinemaId, name: "Phòng 01 - Standard 4K", total_seats: 60 });
        this.addScreen({ cinema_id: newCinemaId, name: "Phòng 02 - VIP Studio", total_seats: 60 });
      }

      this.save();
    }
  },

  updateCinema(id, data) {
    if (this.db) {
      this.db.run(
        `UPDATE cinemas SET name = ?, address = ?, city = ?, status = ? WHERE id = ?`,
        [data.name, data.address || '', data.city || 'TP. Hồ Chí Minh', data.status || 'active', id]
      );
      this.save();
    }
  },

  deleteCinema(id) {
    if (this.db) {
      this.db.run(`DELETE FROM booking_seats WHERE booking_id IN (SELECT id FROM bookings WHERE showtime_id IN (SELECT id FROM showtimes WHERE screen_id IN (SELECT id FROM screens WHERE cinema_id = ?)))`, [id]);
      this.db.run(`DELETE FROM bookings WHERE showtime_id IN (SELECT id FROM showtimes WHERE screen_id IN (SELECT id FROM screens WHERE cinema_id = ?))`, [id]);
      this.db.run(`DELETE FROM showtimes WHERE screen_id IN (SELECT id FROM screens WHERE cinema_id = ?)`, [id]);
      this.db.run(`DELETE FROM seats WHERE screen_id IN (SELECT id FROM screens WHERE cinema_id = ?)`, [id]);
      this.db.run(`DELETE FROM screens WHERE cinema_id = ?`, [id]);
      this.db.run(`DELETE FROM cinemas WHERE id = ?`, [id]);
      this.save();
    }
  },

  getAllScreens() {
    if (this.db) {
      const sql = `
        SELECT sc.*, c.name as cinema_name
        FROM screens sc
        JOIN cinemas c ON sc.cinema_id = c.id
        ORDER BY c.id ASC, sc.id ASC
      `;
      const res = this.db.exec(sql);
      if (!res.length) return [];
      return this.mapRows(res[0]);
    }
    return [];
  },

  getScreensByCinemaId(cinemaId) {
    if (this.db) {
      const sql = `SELECT * FROM screens WHERE cinema_id = ${cinemaId} ORDER BY id ASC`;
      const res = this.db.exec(sql);
      if (!res.length) return [];
      return this.mapRows(res[0]);
    }
    return [];
  },

  addScreen(data) {
    if (this.db) {
      this.db.run(
        `INSERT INTO screens (cinema_id, name, total_seats) VALUES (?, ?, ?)`,
        [parseInt(data.cinema_id), data.name, parseInt(data.total_seats || 60)]
      );

      const screenIdRes = this.db.exec(`SELECT last_insert_rowid() as id`);
      const screenId = (screenIdRes.length && screenIdRes[0].values.length) ? screenIdRes[0].values[0][0] : null;

      if (screenId) {
        const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
        rows.forEach(r => {
          for (let num = 1; num <= 10; num++) {
            const isVip = (r === 'C' || r === 'D' || r === 'E') && (num >= 3 && num <= 8);
            const seatCode = `${r}${num}`;
            const seatType = isVip ? 'vip' : 'standard';
            const multiplier = isVip ? 1.3 : 1.0;

            this.db.run(
              `INSERT INTO seats (screen_id, seat_code, row_name, seat_number, seat_type, price_multiplier)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [screenId, seatCode, r, num, seatType, multiplier]
            );
          }
        });
      }

      this.save();
    }
  },

  updateScreen(id, data) {
    if (this.db) {
      this.db.run(
        `UPDATE screens SET name = ?, total_seats = ? WHERE id = ?`,
        [data.name, parseInt(data.total_seats || 60), id]
      );
      this.save();
    }
  },

  deleteScreen(id) {
    if (this.db) {
      this.db.run(`DELETE FROM booking_seats WHERE booking_id IN (SELECT id FROM bookings WHERE showtime_id IN (SELECT id FROM showtimes WHERE screen_id = ?))`, [id]);
      this.db.run(`DELETE FROM bookings WHERE showtime_id IN (SELECT id FROM showtimes WHERE screen_id = ?)`, [id]);
      this.db.run(`DELETE FROM showtimes WHERE screen_id = ?`, [id]);
      this.db.run(`DELETE FROM seats WHERE screen_id = ?`, [id]);
      this.db.run(`DELETE FROM screens WHERE id = ?`, [id]);
      this.save();
    }
  },

  // --- SHOWTIME MANAGEMENT ---

  getAllShowtimes(includePending = false) {
    if (!this.db) return [];
    this.ensureTenNewShowtimesSeeded();
    this.ensureUsersAndApprovalsSeeded();

    let sql = `
      SELECT st.*, m.title as movie_title, m.poster_url as movie_poster,
             c.name as cinema_name, sc.name as screen_name
      FROM showtimes st
      JOIN movies m ON st.movie_id = m.id
      JOIN screens sc ON st.screen_id = sc.id
      JOIN cinemas c ON sc.cinema_id = c.id
    `;
    if (!includePending) {
      sql += ` WHERE (st.approval_status = 'approved' OR st.approval_status IS NULL)`;
    }
    sql += ` ORDER BY st.id DESC`;

    const res = this.db.exec(sql);
    if (!res.length) return [];
    return this.mapRows(res[0]);
  },

  getMovieById(id) {
    if (this.db && id) {
      const cleanId = parseInt(id);
      const stmt = this.db.prepare(`SELECT * FROM movies WHERE id = ?`);
      stmt.bind([cleanId]);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
    }
    return null;
  },

  ensureAllMoviesHaveShowtimes() {
    if (!this.db) return;
    try {
      const moviesRes = this.db.exec(`SELECT id FROM movies`);
      if (!moviesRes.length || !moviesRes[0].values.length) return;
      const movieIds = moviesRes[0].values.map(v => v[0]);

      const screensRes = this.db.exec(`SELECT id FROM screens`);
      const screenIds = (screensRes.length && screensRes[0].values.length) ? screensRes[0].values.map(v => v[0]) : [1, 2, 3, 4];

      const times = ["09:30", "12:15", "15:00", "18:30", "21:00"];
      const today = new Date();

      let hasAdded = false;

      movieIds.forEach(mId => {
        const checkRes = this.db.exec(`SELECT COUNT(*) FROM showtimes WHERE movie_id = ${mId}`);
        const count = (checkRes.length && checkRes[0].values.length) ? checkRes[0].values[0][0] : 0;

        if (count === 0) {
          hasAdded = true;
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const d = new Date(today);
            d.setDate(today.getDate() + dayOffset);
            const dateStr = d.toISOString().split('T')[0];

            const screen1 = screenIds[(mId % screenIds.length)];
            const screen2 = screenIds[((mId + 1) % screenIds.length)];

            const t1 = times[mId % times.length];
            const t2 = times[(mId + 2) % times.length];

            this.db.run(
              `INSERT INTO showtimes (movie_id, screen_id, show_date, start_time, end_time, base_price, status, approval_status)
               VALUES (?, ?, ?, ?, '2 tiếng', 110000, 'active', 'approved')`,
              [mId, screen1, dateStr, t1]
            );

            this.db.run(
              `INSERT INTO showtimes (movie_id, screen_id, show_date, start_time, end_time, base_price, status, approval_status)
               VALUES (?, ?, ?, ?, '2 tiếng', 120000, 'active', 'approved')`,
              [mId, screen2, dateStr, t2]
            );
          }
        }
      });

      if (hasAdded) {
        this.save();
      }
    } catch (e) {
      console.warn("Error ensuring all movies have showtimes:", e);
    }
  },

  getShowtimes(movieId, showDate = null) {
    if (this.db && movieId) {
      this.ensureAllMoviesHaveShowtimes();
      const cleanMovieId = parseInt(movieId);
      let sql = `
        SELECT st.*, c.name as cinema_name, c.address as cinema_address, sc.name as screen_name, m.title as movie_title
        FROM showtimes st
        JOIN screens sc ON st.screen_id = sc.id
        JOIN cinemas c ON sc.cinema_id = c.id
        JOIN movies m ON st.movie_id = m.id
        WHERE st.movie_id = ${cleanMovieId}
          AND (st.status != 'disabled' AND st.status != 'inactive')
          AND (st.approval_status != 'rejected')
      `;
      if (showDate) sql += ` AND st.show_date = '${showDate}'`;
      sql += ` ORDER BY st.show_date ASC, st.start_time ASC`;

      const res = this.db.exec(sql);
      if (!res.length) return [];
      return this.mapRows(res[0]);
    }
    return [];
  },

  getShowtimeById(showtimeId) {
    if (this.db) {
      const sql = `
        SELECT st.*, c.name as cinema_name, c.address as cinema_address, sc.name as screen_name,
               m.title as movie_title, m.poster_url as movie_poster
        FROM showtimes st
        JOIN screens sc ON st.screen_id = sc.id
        JOIN cinemas c ON sc.cinema_id = c.id
        JOIN movies m ON st.movie_id = m.id
        WHERE st.id = ${showtimeId}
      `;
      const res = this.db.exec(sql);
      if (res.length && res[0].values.length) return this.mapRows(res[0])[0];
    }
    return null;
  },

  addShowtime(data, role = 'admin') {
    if (this.db) {
      const approvalStatus = (role === 'staff') ? 'pending_approval' : 'approved';
      this.db.run(
        `INSERT INTO showtimes (movie_id, screen_id, show_date, start_time, end_time, base_price, status, approval_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parseInt(data.movie_id),
          parseInt(data.screen_id),
          data.show_date,
          data.start_time,
          data.end_time || '2 tiếng',
          parseFloat(data.base_price || 110000),
          data.status || 'active',
          approvalStatus
        ]
      );
      this.save();
      return approvalStatus;
    }
  },

  updateShowtime(id, data, role = 'admin') {
    if (this.db) {
      const approvalStatus = (role === 'staff') ? 'pending_approval' : 'approved';
      this.db.run(
        `UPDATE showtimes 
         SET movie_id = ?, screen_id = ?, show_date = ?, start_time = ?, end_time = ?, base_price = ?, status = ?, approval_status = ?
         WHERE id = ?`,
        [
          parseInt(data.movie_id),
          parseInt(data.screen_id),
          data.show_date,
          data.start_time,
          data.end_time || '2 tiếng',
          parseFloat(data.base_price || 110000),
          data.status || 'active',
          approvalStatus,
          id
        ]
      );
      this.save();
      return approvalStatus;
    }
  },

  deleteShowtime(id) {
    if (this.db) {
      this.db.run(`DELETE FROM booking_seats WHERE booking_id IN (SELECT id FROM bookings WHERE showtime_id = ?)`, [id]);
      this.db.run(`DELETE FROM bookings WHERE showtime_id = ?`, [id]);
      this.db.run(`DELETE FROM showtimes WHERE id = ?`, [id]);
      this.save();
    }
  },

  getSeatsByScreenAndShowtime(screenId, showtimeId) {
    if (!this.db) return [];

    const seatsRes = this.db.exec(`SELECT * FROM seats WHERE screen_id = ${screenId} ORDER BY row_name ASC, seat_number ASC`);
    if (!seatsRes.length) return [];
    const allSeats = this.mapRows(seatsRes[0]);

    const bookedRes = this.db.exec(`
      SELECT bs.seat_id 
      FROM booking_seats bs
      JOIN bookings b ON bs.booking_id = b.id
      WHERE b.showtime_id = ${showtimeId} AND b.status != 'cancelled'
    `);

    const bookedSeatIds = new Set();
    if (bookedRes.length && bookedRes[0].values.length) {
      bookedRes[0].values.forEach(v => bookedSeatIds.add(v[0]));
    }

    return allSeats.map(seat => ({
      ...seat,
      isOccupied: bookedSeatIds.has(seat.id)
    }));
  },

  getFoodItems() {
    if (this.db) {
      this.ensureFoodAndPromotionsSeeded();
      const res = this.db.exec(`SELECT * FROM food_items`);
      if (!res.length) return [];
      return this.mapRows(res[0]);
    }
    return [];
  },

  getPromotionByCode(code) {
    if (!this.db || !code) return null;
    this.ensureFoodAndPromotionsSeeded();
    const cleanCode = code.trim().toUpperCase();
    const res = this.db.exec(`SELECT * FROM promotions WHERE UPPER(code) = '${cleanCode}'`);
    if (res.length && res[0].values.length) {
      return this.mapRows(res[0])[0];
    }
    return null;
  },

  findCustomerByEmailOrPhone(emailOrPhone) {
    if (!this.db || !emailOrPhone) return null;
    const term = emailOrPhone.trim();
    if (!term) return null;
    try {
      const res = this.db.exec(`SELECT * FROM customers WHERE (email != '' AND email = '${term}') OR (phone != '' AND phone = '${term}')`);
      if (res.length && res[0].values.length) {
        return this.mapRows(res[0])[0];
      }
    } catch (e) {
      console.warn("Error finding customer:", e);
    }
    return null;
  },

  createBooking(customerData, showtimeId, selectedSeats = [], foodSelection = [], promoDetails = null, paymentMethod = 'momo') {
    if (!this.db) throw new Error("Database not initialized");

    const custName = (customerData.fullName || 'Nguyễn Văn An').trim();
    const custEmail = (customerData.email || 'khach@gmail.com').trim();
    const custPhone = (customerData.phone || '0901234567').trim();

    let customerId = null;
    const existing = this.findCustomerByEmailOrPhone(custPhone || custEmail);
    if (existing) {
      customerId = existing.id;
    } else {
      this.db.run(
        `INSERT INTO customers (full_name, email, phone) VALUES (?, ?, ?)`,
        [custName, custEmail, custPhone]
      );
      const customerIdRes = this.db.exec(`SELECT last_insert_rowid() as id`);
      customerId = (customerIdRes.length && customerIdRes[0].values.length) ? customerIdRes[0].values[0][0] : 1;
    }

    const showtime = this.getShowtimeById(showtimeId);
    if (!showtime) throw new Error("Showtime not found");

    let ticketAmount = 0;
    selectedSeats.forEach(seat => {
      ticketAmount += showtime.base_price * (seat.price_multiplier || 1.0);
    });

    let foodAmount = 0;
    const foodSummary = [];
    foodSelection.forEach(item => {
      const sub = item.price * item.quantity;
      foodAmount += sub;
      foodSummary.push(`${item.name} x${item.quantity}`);
    });

    const subtotal = ticketAmount + foodAmount;
    let discountAmount = 0;
    let promoCode = null;

    if (promoDetails) {
      promoCode = promoDetails.code || null;
      if (promoDetails.discount_type === 'percentage') {
        discountAmount = (subtotal * promoDetails.discount_value) / 100;
      } else {
        discountAmount = promoDetails.discount_value;
      }
      if (discountAmount > subtotal) discountAmount = subtotal;
    }

    const totalAmount = subtotal - discountAmount;
    const bookingCode = Utils.generateBookingCode();

    this.ensureBookingsSchemaUpToDate();

    const pragma = this.db.exec(`PRAGMA table_info(bookings)`);
    const availableCols = (pragma.length && pragma[0].values.length) 
      ? pragma[0].values.map(v => v[1]) 
      : ['booking_code', 'customer_id', 'showtime_id', 'total_amount', 'status'];

    const targetFieldMap = {
      booking_code: bookingCode,
      customer_id: customerId,
      showtime_id: showtimeId,
      total_amount: totalAmount,
      ticket_amount: ticketAmount,
      food_amount: foodAmount,
      discount_amount: discountAmount,
      discount_code: promoCode || '',
      food_details: foodSummary.join(', '),
      payment_method: paymentMethod || 'momo',
      status: 'confirmed',
      payment_status: 'paid'
    };

    const validCols = [];
    const validVals = [];

    Object.keys(targetFieldMap).forEach(colName => {
      if (availableCols.includes(colName)) {
        validCols.push(colName);
        validVals.push(targetFieldMap[colName]);
      }
    });

    const placeholders = validCols.map(() => '?').join(', ');
    const dynamicSql = `INSERT INTO bookings (${validCols.join(', ')}) VALUES (${placeholders})`;

    this.db.run(dynamicSql, validVals);

    const bookingIdRes = this.db.exec(`SELECT last_insert_rowid() as id`);
    const bookingId = (bookingIdRes.length && bookingIdRes[0].values.length) ? bookingIdRes[0].values[0][0] : Date.now();

    selectedSeats.forEach(seat => {
      const price = showtime.base_price * (seat.price_multiplier || 1.0);
      this.db.run(
        `INSERT INTO booking_seats (booking_id, seat_id, price) VALUES (?, ?, ?)`,
        [bookingId, seat.id, price]
      );
    });

    this.save();

    return {
      bookingId,
      bookingCode,
      totalAmount,
      ticketAmount,
      foodAmount,
      discountAmount,
      promoCode,
      paymentMethod,
      customer: { fullName: custName, phone: custPhone, email: custEmail },
      showtime,
      seats: selectedSeats,
      foodDetails: foodSummary.join(', ')
    };
  },

  getBookingByCode(bookingCode) {
    if (!this.db || !bookingCode) return null;
    this.ensureBookingsSchemaUpToDate();

    const cleanCode = bookingCode.trim().toUpperCase();
    const sql = `
      SELECT b.*, c.full_name as customer_name, c.email as customer_email, c.phone as customer_phone,
             m.title as movie_title, m.poster_url as movie_poster,
             cn.name as cinema_name, sc.name as screen_name,
             st.show_date, st.start_time
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN showtimes st ON b.showtime_id = st.id
      JOIN movies m ON st.movie_id = m.id
      JOIN screens sc ON st.screen_id = sc.id
      JOIN cinemas cn ON sc.cinema_id = cn.id
      WHERE UPPER(b.booking_code) = '${cleanCode}'
    `;
    const res = this.db.exec(sql);
    if (!res.length || !res[0].values.length) return null;

    const booking = this.mapRows(res[0])[0];

    const seatsRes = this.db.exec(`
      SELECT s.seat_code, bs.price
      FROM booking_seats bs
      JOIN seats s ON bs.seat_id = s.id
      WHERE bs.booking_id = ${booking.id}
    `);

    booking.seats = seatsRes.length ? this.mapRows(seatsRes[0]) : [];
    return booking;
  },

  getAllBookings() {
    if (!this.db) return [];
    this.ensureBookingsSchemaUpToDate();

    const sql = `
      SELECT b.*, c.full_name as customer_name, c.phone as customer_phone, c.email as customer_email,
             m.title as movie_title, cn.name as cinema_name, sc.name as screen_name, st.show_date, st.start_time
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN showtimes st ON b.showtime_id = st.id
      JOIN movies m ON st.movie_id = m.id
      JOIN screens sc ON st.screen_id = sc.id
      JOIN cinemas cn ON sc.cinema_id = cn.id
      ORDER BY b.id DESC
    `;
    const res = this.db.exec(sql);
    if (!res.length) return [];
    
    const bookings = this.mapRows(res[0]);
    bookings.forEach(b => {
      const seatsRes = this.db.exec(`
        SELECT s.seat_code
        FROM booking_seats bs
        JOIN seats s ON bs.seat_id = s.id
        WHERE bs.booking_id = ${b.id}
      `);
      b.seats = seatsRes.length ? this.mapRows(seatsRes[0]).map(x => x.seat_code).join(', ') : '';
    });

    return bookings;
  },

  updateBookingStatus(bookingId, status) {
    if (this.db) {
      this.db.run(`UPDATE bookings SET status = ? WHERE id = ?`, [status, bookingId]);
      this.save();
    }
  },

  updateBookingPaymentStatus(bookingId, paymentStatus) {
    if (this.db) {
      this.db.run(`UPDATE bookings SET payment_status = ? WHERE id = ?`, [paymentStatus, bookingId]);
      this.save();
    }
  },

  deleteBooking(id) {
    if (this.db) {
      this.db.run(`DELETE FROM booking_seats WHERE booking_id = ?`, [id]);
      this.db.run(`DELETE FROM bookings WHERE id = ?`, [id]);
      this.save();
    }
  },

  getKpiStats() {
    if (!this.db) return { totalMovies: 0, totalShowtimes: 0, totalBookings: 0, totalRevenue: 0 };

    const m = this.db.exec(`SELECT COUNT(*) FROM movies`)[0]?.values[0][0] || 0;
    const st = this.db.exec(`SELECT COUNT(*) FROM showtimes`)[0]?.values[0][0] || 0;
    const b = this.db.exec(`SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'`)[0]?.values[0][0] || 0;
    const rev = this.db.exec(`SELECT SUM(total_amount) FROM bookings WHERE status = 'confirmed'`)[0]?.values[0][0] || 0;

    return { totalMovies: m, totalShowtimes: st, totalBookings: b, totalRevenue: rev };
  },

  mapRows(resObject) {
    const columns = resObject.columns;
    return resObject.values.map(row => {
      const obj = {};
      columns.forEach((col, idx) => { obj[col] = row[idx]; });
      return obj;
    });
  }
};
