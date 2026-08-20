/**
 * Admin & Operations Portal Logic (Role-Based Access Control RBAC & Approvals System) — Ngọc Châu Cinema
 */

document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  AdminApp.init();
});

const AdminApp = {
  currentTab: 'dashboard',
  currentUser: null,

  init() {
    this.checkAuth();
    this.bindEvents();
    this.configureRoleUI();
    this.renderTab(this.currentTab);
  },

  checkAuth() {
    const savedUser = sessionStorage.getItem('active_user');
    const legacyAdmin = sessionStorage.getItem('admin_logged_in');
    const isLoginPage = window.location.pathname.includes('admin-login.html');

    if (!savedUser && !legacyAdmin && !isLoginPage) {
      window.location.href = 'admin-login.html';
      return;
    }

    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    } else if (legacyAdmin) {
      this.currentUser = { full_name: 'Quản trị viên Hệ thống', email: 'admin@demo.com', role: 'admin' };
    }

    if (this.currentUser && this.currentUser.role === 'user' && !isLoginPage) {
      alert("Tài khoản Khách hàng (User) chỉ có quyền truy cập trang quét & đặt vé xem phim!");
      window.location.href = 'booking.html';
      return;
    }

    if (this.currentUser && isLoginPage) {
      if (this.currentUser.role === 'user') {
        window.location.href = 'booking.html';
      } else {
        window.location.href = 'admin.html';
      }
    }
  },

  login(username, password) {
    // 1. Check SQLite Users DB table
    const user = DB.authenticateUser(username, password);
    if (user) {
      if (user.role === 'user') {
        sessionStorage.setItem('active_user', JSON.stringify(user));
        localStorage.setItem('ngoc_chau_customer', JSON.stringify({ full_name: user.full_name, phone: user.phone || '0901234567', email: user.email }));
        Utils.showToast(`Đăng nhập thành công với vai trò USER! Đang chuyển đến trang đặt vé...`, 'success');
        setTimeout(() => { window.location.href = 'booking.html'; }, 500);
        return true;
      }

      sessionStorage.setItem('active_user', JSON.stringify(user));
      sessionStorage.setItem('admin_logged_in', 'true');
      Utils.showToast(`Đăng nhập thành công! Vai trò: ${user.role.toUpperCase()}`, 'success');
      setTimeout(() => { window.location.href = 'admin.html'; }, 500);
      return true;
    }

    // 2. Legacy fallback check
    if (username === 'admin' && password === 'admin123') {
      const adminUser = { full_name: 'Quản trị viên Hệ thống', email: 'admin@demo.com', role: 'admin' };
      sessionStorage.setItem('active_user', JSON.stringify(adminUser));
      sessionStorage.setItem('admin_logged_in', 'true');
      Utils.showToast('Đăng nhập quản trị thành công!', 'success');
      setTimeout(() => { window.location.href = 'admin.html'; }, 500);
      return true;
    }

    Utils.showToast('Tài khoản hoặc mật khẩu không chính xác!', 'error');
    return false;
  },

  logout() {
    sessionStorage.removeItem('active_user');
    sessionStorage.removeItem('admin_logged_in');
    window.location.href = 'admin-login.html';
  },

  configureRoleUI() {
    if (!this.currentUser) return;

    const role = this.currentUser.role || 'admin';
    const roleBadgeEl = document.getElementById('portal-role-badge');
    const userDisplayEl = document.getElementById('user-display-info');
    const userAvatarEl = document.getElementById('user-avatar');

    if (roleBadgeEl) roleBadgeEl.textContent = `${role.toUpperCase()} PORTAL`;
    if (userDisplayEl) userDisplayEl.innerHTML = `Xin chào, <strong>${this.currentUser.full_name}</strong> (${role.toUpperCase()})`;
    if (userAvatarEl) userAvatarEl.textContent = (this.currentUser.full_name || 'A')[0].toUpperCase();

    // Restrict sidebar items based on Role
    const menuItems = document.querySelectorAll('.menu-item[data-tab]');
    menuItems.forEach(item => {
      const tab = item.dataset.tab;
      if (role === 'staff') {
        if (tab !== 'showtimes') item.style.display = 'none';
        else item.classList.add('active');
      } else if (role === 'sponsor') {
        if (tab !== 'movies') item.style.display = 'none';
        else item.classList.add('active');
      }
    });

    if (role === 'staff') this.currentTab = 'showtimes';
    else if (role === 'sponsor') this.currentTab = 'movies';
  },

  bindEvents() {
    // Sidebar menu clicks
    const menuItems = document.querySelectorAll('.menu-item[data-tab]');
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        menuItems.forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        this.currentTab = item.dataset.tab;
        this.renderTab(this.currentTab);
      });
    });

    // Login Form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        this.login(u, p);
      });
    }

    // Movie Form
    const movieForm = document.getElementById('movie-form');
    if (movieForm) {
      movieForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveMovie();
      });
    }

    // Showtime Form
    const showtimeForm = document.getElementById('showtime-form');
    if (showtimeForm) {
      showtimeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveShowtime();
      });
    }

    // Cinema Form
    const cinemaForm = document.getElementById('cinema-form');
    if (cinemaForm) {
      cinemaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveCinema();
      });
    }

    // Screen Form
    const screenForm = document.getElementById('screen-form');
    if (screenForm) {
      screenForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveScreen();
      });
    }

    // Promo Form
    const promoForm = document.getElementById('promo-form');
    if (promoForm) {
      promoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.savePromotion();
      });
    }

    // User Form
    const userForm = document.getElementById('user-form');
    if (userForm) {
      userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveUser();
      });
    }
  },

  renderTab(tab) {
    const mainBody = document.getElementById('admin-content');
    if (!mainBody) return;

    if (tab === 'dashboard') {
      this.renderDashboard(mainBody);
    } else if (tab === 'movies') {
      this.renderMoviesTab(mainBody);
    } else if (tab === 'showtimes') {
      this.renderShowtimesTab(mainBody);
    } else if (tab === 'bookings') {
      this.renderBookingsTab(mainBody);
    } else if (tab === 'cinemas') {
      this.renderCinemasTab(mainBody);
    } else if (tab === 'promotions') {
      this.renderPromotionsTab(mainBody);
    } else if (tab === 'approvals') {
      this.renderApprovalsTab(mainBody);
    } else if (tab === 'users') {
      this.renderUsersTab(mainBody);
    }
  },

  // --- KPI & DASHBOARD VIEW ---
  renderDashboard(container) {
    const stats = DB.getKpiStats();
    const recentBookings = DB.getAllBookings().slice(0, 5);

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-info">
            <span class="kpi-label">Tổng số phim</span>
            <span class="kpi-value">${stats.totalMovies}</span>
          </div>
          <div class="kpi-icon">🎬</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <span class="kpi-label">Suất chiếu</span>
            <span class="kpi-value">${stats.totalShowtimes}</span>
          </div>
          <div class="kpi-icon">⏰</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <span class="kpi-label">Đơn đặt vé</span>
            <span class="kpi-value">${stats.totalBookings}</span>
          </div>
          <div class="kpi-icon">🎟️</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <span class="kpi-label">Tổng doanh thu</span>
            <span class="kpi-value" style="color: var(--primary-gold);">${Utils.formatCurrency(stats.totalRevenue)}</span>
          </div>
          <div class="kpi-icon">💰</div>
        </div>
      </div>

      <div class="data-card">
        <div class="data-card-header">
          <h3 style="font-size: 1.1rem; font-weight: 700;">Đơn đặt vé gần đây</h3>
          <button class="btn btn-outline btn-sm" onclick="AdminApp.renderTab('bookings')">Xem tất cả</button>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Khách hàng</th>
                <th>Phim</th>
                <th>Rạp</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${recentBookings.length ? recentBookings.map(b => `
                <tr>
                  <td><strong style="color: var(--primary-gold);">${b.booking_code}</strong></td>
                  <td>${b.customer_name} (${b.customer_phone})</td>
                  <td>${b.movie_title}</td>
                  <td>${b.cinema_name}</td>
                  <td><strong>${Utils.formatCurrency(b.total_amount)}</strong></td>
                  <td><span class="status-badge ${b.status}">${b.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'}</span></td>
                </tr>
              `).join('') : `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Chưa có đơn đặt vé nào.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --- MOVIE MANAGEMENT TAB (SPONSOR & ADMIN) ---
  renderMoviesTab(container) {
    const role = this.currentUser ? this.currentUser.role : 'admin';
    const movies = DB.getMovies(null, true);

    container.innerHTML = `
      <div class="data-card">
        <div class="data-card-header">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700;">Quản lý danh sách phim (${movies.length} phim)</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
              ${role === 'sponsor' ? '🎬 Vai trò Nhà Tài Trợ: Thêm phim mới hoặc sửa thông tin sẽ gửi lên cho Admin phê duyệt.' : 'Quản lý toàn bộ danh sách phim của hệ thống rạp.'}
            </p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminApp.openAddMovieModal()">+ Thêm phim mới</button>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Poster</th>
                <th>Tên Phim</th>
                <th>Thể loại</th>
                <th>Thời lượng</th>
                <th>Phê Duyệt</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              ${movies.map(m => `
                <tr>
                  <td>#${m.id}</td>
                  <td><img src="${m.poster_url}" alt="${m.title}" style="width: 45px; height: 60px; object-fit: cover; border-radius: 4px;"></td>
                  <td>
                    <strong style="color: var(--text-primary);">${m.title}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Khởi chiếu: ${m.release_date || '2026'}</div>
                  </td>
                  <td>${m.genre}</td>
                  <td>${m.duration_minutes} phút</td>
                  <td>
                    <span class="status-badge ${m.approval_status === 'pending_approval' ? 'pending' : (m.approval_status === 'rejected' ? 'cancelled' : 'active')}">
                      ${m.approval_status === 'pending_approval' ? '⏳ Chờ Admin duyệt' : (m.approval_status === 'rejected' ? '❌ Từ chối' : '✓ Đã duyệt')}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge ${m.status === 'now_showing' ? 'active' : 'pending'}">
                      ${m.status === 'now_showing' ? 'Đang chiếu' : 'Sắp chiếu'}
                    </span>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-secondary btn-sm" onclick="AdminApp.openEditMovieModal(${m.id})">✏️ Sửa</button>
                      ${role === 'admin' ? `<button class="btn btn-danger btn-sm" onclick="AdminApp.deleteMovie(${m.id}, '${m.title.replace(/'/g, "\\'")}')">🗑️ Xóa</button>` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openAddMovieModal() {
    document.getElementById('movie-modal-title').textContent = "🎬 Thêm Phim Mới";
    document.getElementById('movie-id').value = "";
    document.getElementById('movie-title').value = "";
    document.getElementById('movie-genre').value = "";
    document.getElementById('movie-duration').value = "120";
    document.getElementById('movie-age').value = "P";
    document.getElementById('movie-status').value = "now_showing";
    document.getElementById('movie-release').value = new Date().toISOString().split('T')[0];
    document.getElementById('movie-poster').value = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop";
    document.getElementById('movie-desc').value = "";

    const modal = document.getElementById('movie-modal');
    if (modal) modal.classList.add('show');
  },

  openEditMovieModal(movieId) {
    const movie = DB.getMovieById(movieId);
    if (!movie) return;

    document.getElementById('movie-modal-title').textContent = `✏️ Sửa Phim: ${movie.title}`;
    document.getElementById('movie-id').value = movie.id;
    document.getElementById('movie-title').value = movie.title;
    document.getElementById('movie-genre').value = movie.genre;
    document.getElementById('movie-duration').value = movie.duration_minutes;
    document.getElementById('movie-age').value = movie.age_rating || 'P';
    document.getElementById('movie-status').value = movie.status || 'now_showing';
    document.getElementById('movie-release').value = movie.release_date || new Date().toISOString().split('T')[0];
    document.getElementById('movie-poster').value = movie.poster_url || '';
    document.getElementById('movie-desc').value = movie.description || '';

    const modal = document.getElementById('movie-modal');
    if (modal) modal.classList.add('show');
  },

  closeMovieModal() {
    const modal = document.getElementById('movie-modal');
    if (modal) modal.classList.remove('show');
  },

  saveMovie() {
    const id = document.getElementById('movie-id').value;
    const title = document.getElementById('movie-title').value.trim();
    const genre = document.getElementById('movie-genre').value.trim();
    const duration = parseInt(document.getElementById('movie-duration').value || 120);
    const age = document.getElementById('movie-age').value;
    const status = document.getElementById('movie-status').value;
    const release = document.getElementById('movie-release').value;
    const poster = document.getElementById('movie-poster').value.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop';
    const desc = document.getElementById('movie-desc').value.trim();

    if (!title || !genre) {
      Utils.showToast("Vui lòng điền đầy đủ Tên phim và Thể loại!", "error");
      return;
    }

    const movieData = { title, genre, duration_minutes: duration, age_rating: age, status, release_date: release, poster_url: poster, backdrop_url: poster, description: desc };
    const role = this.currentUser ? this.currentUser.role : 'admin';

    if (id) {
      const appStatus = DB.updateMovie(parseInt(id), movieData, role);
      if (appStatus === 'pending_approval') {
        Utils.showToast(`Đã gửi yêu cầu chỉnh sửa phim "${title}". Đang chờ Admin phê duyệt!`, "info");
      } else {
        Utils.showToast(`Đã cập nhật thông tin phim "${title}"!`, "success");
      }
    } else {
      const appStatus = DB.addMovie(movieData, role);
      if (appStatus === 'pending_approval') {
        Utils.showToast(`Đã thêm phim mới "${title}". Đang chờ Admin phê duyệt!`, "info");
      } else {
        Utils.showToast(`Đã thêm phim mới "${title}" vào hệ thống!`, "success");
      }
    }

    this.closeMovieModal();
    this.renderTab('movies');
  },

  deleteMovie(id, title = '') {
    if (confirm(`Bạn có chắc chắn muốn xóa phim "${title || 'này'}" khỏi hệ thống?`)) {
      DB.deleteMovie(id);
      Utils.showToast("Đã xóa phim khỏi cơ sở dữ liệu!", "success");
      this.renderTab('movies');
    }
  },

  // --- SHOWTIME MANAGEMENT TAB (STAFF & ADMIN) ---
  renderShowtimesTab(container) {
    const role = this.currentUser ? this.currentUser.role : 'admin';
    const showtimes = DB.getAllShowtimes(true);

    container.innerHTML = `
      <div class="data-card">
        <div class="data-card-header">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700;">Quản lý danh sách suất chiếu (${showtimes.length} suất chiếu)</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
              ${role === 'staff' ? '⏰ Vai trò Staff: Thêm/sửa suất chiếu mới sẽ gửi lên hệ thống chờ Admin duyệt.' : 'Lên lịch chiếu phim và quản lý giá vé.'}
            </p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminApp.openAddShowtimeModal()">+ Thêm suất chiếu mới</button>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Phim Chiếu</th>
                <th>Cụm Rạp & Phòng Chiếu</th>
                <th>Ngày Chiếu</th>
                <th>Giờ Chiếu</th>
                <th>Giá Vé</th>
                <th>Phê Duyệt</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              ${showtimes.map(st => `
                <tr>
                  <td>#${st.id}</td>
                  <td><strong>${st.movie_title}</strong></td>
                  <td>
                    <div><strong>${st.cinema_name}</strong></div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${st.screen_name}</div>
                  </td>
                  <td>${Utils.formatDate(st.show_date)}</td>
                  <td><strong style="color: var(--primary-gold); font-size: 1.05rem;">⏰ ${st.start_time}</strong></td>
                  <td><strong style="color: var(--accent-emerald);">${Utils.formatCurrency(st.base_price)}</strong></td>
                  <td>
                    <span class="status-badge ${st.approval_status === 'pending_approval' ? 'pending' : (st.approval_status === 'rejected' ? 'cancelled' : 'active')}">
                      ${st.approval_status === 'pending_approval' ? '⏳ Chờ Admin duyệt' : (st.approval_status === 'rejected' ? '❌ Từ chối' : '✓ Đã duyệt')}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge ${st.status === 'active' ? 'active' : 'pending'}">
                      ${st.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                    </span>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-secondary btn-sm" onclick="AdminApp.openEditShowtimeModal(${st.id})">✏️ Sửa</button>
                      ${role === 'admin' ? `<button class="btn btn-danger btn-sm" onclick="AdminApp.deleteShowtime(${st.id})">🗑️ Xóa</button>` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  populateShowtimeDropdowns(selectedMovieId = null, selectedScreenId = null) {
    const movies = DB.getMovies(null, true);
    const screens = DB.getAllScreens();

    const movieSelect = document.getElementById('showtime-movie-id');
    const screenSelect = document.getElementById('showtime-screen-id');

    if (movieSelect) {
      movieSelect.innerHTML = movies.map(m => `
        <option value="${m.id}" ${selectedMovieId == m.id ? 'selected' : ''}>🎬 ${m.title} (${m.duration_minutes} phút)</option>
      `).join('');
    }

    if (screenSelect) {
      screenSelect.innerHTML = screens.map(s => `
        <option value="${s.id}" ${selectedScreenId == s.id ? 'selected' : ''}>🏛️ ${s.cinema_name} — ${s.name}</option>
      `).join('');
    }
  },

  openAddShowtimeModal() {
    this.populateShowtimeDropdowns();
    document.getElementById('showtime-modal-title').textContent = "⏰ Thêm Suất Chiếu Mới";
    document.getElementById('showtime-id').value = "";
    document.getElementById('showtime-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('showtime-time').value = "14:30";
    document.getElementById('showtime-price').value = "110000";
    document.getElementById('showtime-status').value = "active";

    const modal = document.getElementById('showtime-modal');
    if (modal) modal.classList.add('show');
  },

  openEditShowtimeModal(showtimeId) {
    const showtime = DB.getShowtimeById(showtimeId);
    if (!showtime) return;

    this.populateShowtimeDropdowns(showtime.movie_id, showtime.screen_id);
    document.getElementById('showtime-modal-title').textContent = `✏️ Sửa Suất Chiếu #${showtime.id}`;
    document.getElementById('showtime-id').value = showtime.id;
    document.getElementById('showtime-date').value = showtime.show_date || new Date().toISOString().split('T')[0];
    document.getElementById('showtime-time').value = showtime.start_time || "14:30";
    document.getElementById('showtime-price').value = showtime.base_price || 110000;
    document.getElementById('showtime-status').value = showtime.status || "active";

    const modal = document.getElementById('showtime-modal');
    if (modal) modal.classList.add('show');
  },

  closeShowtimeModal() {
    const modal = document.getElementById('showtime-modal');
    if (modal) modal.classList.remove('show');
  },

  saveShowtime() {
    const id = document.getElementById('showtime-id').value;
    const movieId = document.getElementById('showtime-movie-id').value;
    const screenId = document.getElementById('showtime-screen-id').value;
    const date = document.getElementById('showtime-date').value;
    const time = document.getElementById('showtime-time').value.trim();
    const price = parseFloat(document.getElementById('showtime-price').value || 110000);
    const status = document.getElementById('showtime-status').value;

    if (!movieId || !screenId || !date || !time) {
      Utils.showToast("Vui lòng điền đầy đủ thông tin suất chiếu!", "error");
      return;
    }

    const showtimeData = { movie_id: movieId, screen_id: screenId, show_date: date, start_time: time, end_time: '2 tiếng', base_price: price, status };
    const role = this.currentUser ? this.currentUser.role : 'admin';

    if (id) {
      const appStatus = DB.updateShowtime(parseInt(id), showtimeData, role);
      if (appStatus === 'pending_approval') {
        Utils.showToast(`Đã gửi yêu cầu chỉnh sửa suất chiếu #${id}. Đang chờ Admin phê duyệt!`, "info");
      } else {
        Utils.showToast(`Đã cập nhật thông tin suất chiếu #${id}!`, "success");
      }
    } else {
      const appStatus = DB.addShowtime(showtimeData, role);
      if (appStatus === 'pending_approval') {
        Utils.showToast("Đã gửi suất chiếu mới. Đang chờ Admin phê duyệt!", "info");
      } else {
        Utils.showToast("Đã thêm suất chiếu mới vào hệ thống!", "success");
      }
    }

    this.closeShowtimeModal();
    this.renderTab('showtimes');
  },

  deleteShowtime(id) {
    if (confirm(`Bạn có chắc chắn muốn xóa suất chiếu #${id}?`)) {
      DB.deleteShowtime(id);
      Utils.showToast("Đã xóa suất chiếu thành công!", "success");
      this.renderTab('showtimes');
    }
  },

  // --- PROMOTIONS TAB (FULL CRUD) ---
  renderPromotionsTab(container) {
    const promos = DB.getAllPromotions();

    container.innerHTML = `
      <div class="data-card">
        <div class="data-card-header">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700;">Quản lý danh sách mã giảm giá (${promos.length} mã)</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">Tạo mã ưu đãi, giảm % hoặc giảm giá cố định cho thành viên đăng nhập.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminApp.openAddPromoModal()">+ Thêm mã giảm giá</button>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mã (Code)</th>
                <th>Mô tả chi tiết</th>
                <th>Loại ưu đãi</th>
                <th>Giá trị giảm</th>
                <th>Đơn tối thiểu</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              ${promos.map(p => `
                <tr>
                  <td>#${p.id}</td>
                  <td><strong style="color: var(--primary-gold); font-size: 1.05rem;">🎁 ${p.code}</strong></td>
                  <td>${p.description}</td>
                  <td><span class="badge badge-age">${p.discount_type === 'percentage' ? '% Phần trăm' : 'VNĐ Cố định'}</span></td>
                  <td><strong style="color: var(--accent-emerald);">${p.discount_type === 'percentage' ? `${p.discount_value}%` : Utils.formatCurrency(p.discount_value)}</strong></td>
                  <td>${Utils.formatCurrency(p.min_order_amount || 0)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-secondary btn-sm" onclick="AdminApp.openEditPromoModal(${p.id})">✏️ Sửa</button>
                      <button class="btn btn-danger btn-sm" onclick="AdminApp.deletePromotion(${p.id})">🗑️ Xóa</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openAddPromoModal() {
    document.getElementById('promo-modal-title').textContent = "🎁 Thêm Mã Giảm Giá Mới";
    document.getElementById('promo-id').value = "";
    document.getElementById('promo-code').value = "";
    document.getElementById('promo-desc').value = "";
    document.getElementById('promo-type').value = "percentage";
    document.getElementById('promo-val').value = "10";
    document.getElementById('promo-min-order').value = "0";

    const modal = document.getElementById('promo-modal');
    if (modal) modal.classList.add('show');
  },

  openEditPromoModal(id) {
    const promo = DB.getPromotionById(id);
    if (!promo) return;

    document.getElementById('promo-modal-title').textContent = `✏️ Sửa Mã Giảm Giá: ${promo.code}`;
    document.getElementById('promo-id').value = promo.id;
    document.getElementById('promo-code').value = promo.code;
    document.getElementById('promo-desc').value = promo.description || '';
    document.getElementById('promo-type').value = promo.discount_type || 'percentage';
    document.getElementById('promo-val').value = promo.discount_value || 10;
    document.getElementById('promo-min-order').value = promo.min_order_amount || 0;

    const modal = document.getElementById('promo-modal');
    if (modal) modal.classList.add('show');
  },

  closePromoModal() {
    const modal = document.getElementById('promo-modal');
    if (modal) modal.classList.remove('show');
  },

  savePromotion() {
    const id = document.getElementById('promo-id').value;
    const code = document.getElementById('promo-code').value.trim();
    const desc = document.getElementById('promo-desc').value.trim();
    const type = document.getElementById('promo-type').value;
    const val = parseFloat(document.getElementById('promo-val').value || 10);
    const minOrder = parseFloat(document.getElementById('promo-min-order').value || 0);

    if (!code || !val) {
      Utils.showToast("Vui lòng điền Mã giảm giá và Giá trị giảm!", "error");
      return;
    }

    const promoData = { code, description: desc, discount_type: type, discount_value: val, min_order_amount: minOrder };

    if (id) {
      DB.updatePromotion(parseInt(id), promoData);
      Utils.showToast(`Đã cập nhật mã giảm giá "${code}"!`, "success");
    } else {
      DB.addPromotion(promoData);
      Utils.showToast(`Đã thêm mã giảm giá mới "${code}"!`, "success");
    }

    this.closePromoModal();
    this.renderTab('promotions');
  },

  deletePromotion(id) {
    if (confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) {
      DB.deletePromotion(id);
      Utils.showToast("Đã xóa mã giảm giá thành công!", "success");
      this.renderTab('promotions');
    }
  },

  // --- APPROVALS SYSTEM TAB (ADMIN ONLY) ---
  renderApprovalsTab(container) {
    const pending = DB.getPendingApprovals();
    const totalPending = pending.movies.length + pending.showtimes.length;

    container.innerHTML = `
      <div class="data-card">
        <div class="data-card-header">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700;">Duyệt Nội Dung Tải Lên (${totalPending} yêu cầu chờ duyệt)</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
              Phê duyệt Phim từ <strong>Nhà Tài Trợ (Sponsor)</strong> và Suất Chiếu từ <strong>Nhân Viên (Staff)</strong> trước khi đưa lên ứng dụng công khai.
            </p>
          </div>
        </div>

        <!-- Pending Movies Section -->
        <div style="margin-top: 1rem; margin-bottom: 2rem;">
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--primary-gold); margin-bottom: 0.8rem;">🎬 Phim từ Nhà Tài Trợ (${pending.movies.length} chờ duyệt)</h4>
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Poster</th>
                  <th>Tên Phim</th>
                  <th>Thể loại</th>
                  <th>Thời lượng</th>
                  <th>Khởi chiếu</th>
                  <th>Hành động Duyệt</th>
                </tr>
              </thead>
              <tbody>
                ${pending.movies.length ? pending.movies.map(m => `
                  <tr>
                    <td><img src="${m.poster_url}" alt="${m.title}" style="width: 45px; height: 60px; object-fit: cover; border-radius: 4px;"></td>
                    <td><strong>${m.title}</strong></td>
                    <td>${m.genre}</td>
                    <td>${m.duration_minutes} phút</td>
                    <td>${m.release_date}</td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn-primary btn-sm" onclick="AdminApp.approveMovie(${m.id})">✓ Duyệt Phim</button>
                        <button class="btn btn-danger btn-sm" onclick="AdminApp.rejectMovie(${m.id})">❌ Từ chối</button>
                      </div>
                    </td>
                  </tr>
                `).join('') : `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Không có phim nào chờ duyệt.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pending Showtimes Section -->
        <div>
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--primary-gold); margin-bottom: 0.8rem;">⏰ Suất Chiếu từ Nhân Viên Staff (${pending.showtimes.length} chờ duyệt)</h4>
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Phim</th>
                  <th>Rạp & Phòng</th>
                  <th>Ngày chiếu</th>
                  <th>Giờ chiếu</th>
                  <th>Giá vé</th>
                  <th>Hành động Duyệt</th>
                </tr>
              </thead>
              <tbody>
                ${pending.showtimes.length ? pending.showtimes.map(st => `
                  <tr>
                    <td><strong>${st.movie_title}</strong></td>
                    <td>${st.cinema_name} (${st.screen_name})</td>
                    <td>${Utils.formatDate(st.show_date)}</td>
                    <td><strong style="color: var(--primary-gold);">⏰ ${st.start_time}</strong></td>
                    <td>${Utils.formatCurrency(st.base_price)}</td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn-primary btn-sm" onclick="AdminApp.approveShowtime(${st.id})">✓ Duyệt Suất</button>
                        <button class="btn btn-danger btn-sm" onclick="AdminApp.rejectShowtime(${st.id})">❌ Từ chối</button>
                      </div>
                    </td>
                  </tr>
                `).join('') : `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Không có suất chiếu nào chờ duyệt.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  approveMovie(id) {
    DB.approveMovie(id);
    Utils.showToast("Đã phê duyệt phim thành công!", "success");
    this.renderTab('approvals');
  },

  rejectMovie(id) {
    DB.rejectMovie(id);
    Utils.showToast("Đã từ chối phim!", "info");
    this.renderTab('approvals');
  },

  approveShowtime(id) {
    DB.approveShowtime(id);
    Utils.showToast("Đã phê duyệt suất chiếu thành công!", "success");
    this.renderTab('approvals');
  },

  rejectShowtime(id) {
    DB.rejectShowtime(id);
    Utils.showToast("Đã từ chối suất chiếu!", "info");
    this.renderTab('approvals');
  },

  // --- USERS & ROLES TAB (ADMIN USER MANAGEMENT & ROLE ASSIGNMENT) ---
  renderUsersTab(container) {
    const users = DB.getAllUsers();

    container.innerHTML = `
      <div class="data-card">
        <div class="data-card-header">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700;">⚙️ Quản lý Phân Quyền & Tài Khoản (${users.length} tài khoản)</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
              Admin có thể thay đổi phân quyền trực tiếp (Admin, Staff, Sponsor, User), chỉnh sửa thông tin hoặc thêm mới tài khoản.
            </p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminApp.openAddUserModal()">+ Thêm tài khoản mới</button>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ & Tên</th>
                <th>Email Đăng Nhập</th>
                <th>Số Điện Thoại</th>
                <th>Phân Quyền Vai Trò (Role)</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>#${u.id}</td>
                  <td><strong style="color: var(--text-primary);">${u.full_name}</strong></td>
                  <td><strong style="color: var(--primary-gold);">${u.email}</strong></td>
                  <td>${u.phone || '0901234567'}</td>
                  <td>
                    <!-- Quick Dropdown to Assign Role directly in 1-click -->
                    <select class="form-control" style="padding: 0.35rem 0.6rem; font-size: 0.85rem; font-weight: 700; min-width: 160px; background-color: var(--bg-surface); color: ${u.role === 'admin' ? 'var(--primary-gold)' : (u.role === 'sponsor' ? '#ec4899' : (u.role === 'staff' ? '#3b82f6' : 'var(--text-primary)'))}; border: 1px solid var(--border-color-gold);"
                            onchange="AdminApp.quickChangeRole(${u.id}, this.value, '${u.full_name.replace(/'/g, "\\'")}')">
                      <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>👑 ADMIN</option>
                      <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>⏰ STAFF</option>
                      <option value="sponsor" ${u.role === 'sponsor' ? 'selected' : ''}>🎬 NHÀ TÀI TRỢ</option>
                      <option value="user" ${u.role === 'user' ? 'selected' : ''}>🎟️ USER</option>
                    </select>
                  </td>
                  <td>
                    <span class="status-badge ${u.status === 'active' ? 'active' : 'cancelled'}">
                      ${u.status === 'active' ? '✓ Hoạt động' : '🔒 Đã khóa'}
                    </span>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-secondary btn-sm" onclick="AdminApp.openEditUserModal(${u.id})">⚙️ Sửa TK</button>
                      <button class="btn btn-danger btn-sm" onclick="AdminApp.deleteUser(${u.id}, '${u.full_name.replace(/'/g, "\\'")}')">🗑️ Xóa</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  quickChangeRole(userId, newRole, userName = '') {
    DB.updateUserRole(userId, newRole);
    Utils.showToast(`🎉 Đã cập nhật vai trò tài khoản "${userName || '#' + userId}" thành ${newRole.toUpperCase()}!`, "success");
    
    // Update local active_user in session if editing currently logged-in account
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser.role = newRole;
      sessionStorage.setItem('active_user', JSON.stringify(this.currentUser));
      this.configureRoleUI();
    }
    
    this.renderTab('users');
  },

  openAddUserModal() {
    document.getElementById('user-modal-title').textContent = "➕ Thêm Tài Khoản Mới & Phân Quyền";
    document.getElementById('user-id').value = "";
    document.getElementById('user-fullname').value = "";
    document.getElementById('user-email').value = "";
    document.getElementById('user-phone').value = "";
    document.getElementById('user-password').value = "123456";
    document.getElementById('user-role').value = "staff";
    document.getElementById('user-status').value = "active";

    const modal = document.getElementById('user-modal');
    if (modal) modal.classList.add('show');
  },

  openEditUserModal(userId) {
    const user = DB.getUserById(userId);
    if (!user) return;

    document.getElementById('user-modal-title').textContent = `⚙️ Phân Quyền & Sửa TK: ${user.full_name}`;
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-fullname').value = user.full_name;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-phone').value = user.phone || '';
    document.getElementById('user-password').value = "";
    document.getElementById('user-role').value = user.role || 'user';
    document.getElementById('user-status').value = user.status || 'active';

    const modal = document.getElementById('user-modal');
    if (modal) modal.classList.add('show');
  },

  closeUserModal() {
    const modal = document.getElementById('user-modal');
    if (modal) modal.classList.remove('show');
  },

  saveUser() {
    const id = document.getElementById('user-id').value;
    const fullname = document.getElementById('user-fullname').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    const password = document.getElementById('user-password').value.trim();
    const role = document.getElementById('user-role').value;
    const status = document.getElementById('user-status').value;

    if (!fullname || !email) {
      Utils.showToast("Vui lòng nhập đầy đủ Họ tên và Email!", "error");
      return;
    }

    const userData = { full_name: fullname, email, phone, password, role, status };

    if (id) {
      DB.updateUser(parseInt(id), userData);
      Utils.showToast(`Đã cập nhật tài khoản "${fullname}" thành công! Vai trò: ${role.toUpperCase()}`, "success");
    } else {
      DB.addUser(userData);
      Utils.showToast(`Đã thêm tài khoản mới "${fullname}" thành công! Vai trò: ${role.toUpperCase()}`, "success");
    }

    this.closeUserModal();
    this.renderTab('users');
  },

  deleteUser(id, name = '') {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}" khỏi hệ thống?`)) {
      DB.deleteUser(id);
      Utils.showToast("Đã xóa tài khoản thành công!", "success");
      this.renderTab('users');
    }
  },


  // --- CINEMA TAB ---
  renderCinemasTab(container) {
    const cinemas = DB.getCinemas();

    container.innerHTML = `
      <div class="data-card">
        <div class="data-card-header">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700;">Hệ thống Cụm Rạp & Phòng Chiếu (${cinemas.length} cụm rạp)</h3>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminApp.openAddCinemaModal()">+ Thêm Cụm Rạp Mới</button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1rem;">
          ${cinemas.map(c => {
            const screens = DB.getScreensByCinemaId(c.id);
            return `
              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px; padding: 1.2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.8rem; margin-bottom: 1rem;">
                  <div>
                    <h4 style="font-size: 1.15rem; color: var(--primary-gold); font-weight: 700;">🏛️ ${c.name}</h4>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">📍 ${c.address} (${c.city || 'TP. Hồ Chí Minh'})</div>
                  </div>
                  <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-outline btn-sm" onclick="AdminApp.openAddScreenModal(${c.id})">+ Thêm phòng</button>
                    <button class="btn btn-secondary btn-sm" onclick="AdminApp.openEditCinemaModal(${c.id})">✏️ Sửa rạp</button>
                    <button class="btn btn-danger btn-sm" onclick="AdminApp.deleteCinema(${c.id}, '${c.name.replace(/'/g, "\\'")}')">🗑️ Xóa rạp</button>
                  </div>
                </div>

                <div>
                  <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.6rem; color: var(--text-secondary);">Danh sách phòng chiếu (${screens.length} phòng):</h5>
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.8rem;">
                    ${screens.map(s => `
                      <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <div style="font-weight: 600; font-size: 0.9rem; color: #fff;">🎦 ${s.name}</div>
                          <div style="font-size: 0.75rem; color: var(--primary-gold);">💺 ${s.total_seats || 60} Ghế</div>
                        </div>
                        <div style="display: flex; gap: 0.3rem;">
                          <button class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;" onclick="AdminApp.openEditScreenModal(${s.id})">✏️</button>
                          <button class="btn btn-danger btn-sm" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;" onclick="AdminApp.deleteScreen(${s.id})">🗑️</button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  openAddCinemaModal() {
    document.getElementById('cinema-modal-title').textContent = "🏛️ Thêm Cụm Rạp Mới";
    document.getElementById('cinema-id').value = "";
    document.getElementById('cinema-name').value = "";
    document.getElementById('cinema-address').value = "";
    document.getElementById('cinema-city').value = "TP. Hồ Chí Minh";
    document.getElementById('cinema-status').value = "active";

    const modal = document.getElementById('cinema-modal');
    if (modal) modal.classList.add('show');
  },

  openEditCinemaModal(cinemaId) {
    const cinema = DB.getCinemaById(cinemaId);
    if (!cinema) return;

    document.getElementById('cinema-modal-title').textContent = `✏️ Sửa Cụm Rạp: ${cinema.name}`;
    document.getElementById('cinema-id').value = cinema.id;
    document.getElementById('cinema-name').value = cinema.name;
    document.getElementById('cinema-address').value = cinema.address || '';
    document.getElementById('cinema-city').value = cinema.city || 'TP. Hồ Chí Minh';
    document.getElementById('cinema-status').value = cinema.status || 'active';

    const modal = document.getElementById('cinema-modal');
    if (modal) modal.classList.add('show');
  },

  closeCinemaModal() {
    const modal = document.getElementById('cinema-modal');
    if (modal) modal.classList.remove('show');
  },

  saveCinema() {
    const id = document.getElementById('cinema-id').value;
    const name = document.getElementById('cinema-name').value.trim();
    const address = document.getElementById('cinema-address').value.trim();
    const city = document.getElementById('cinema-city').value.trim();
    const status = document.getElementById('cinema-status').value;

    if (!name || !address) {
      Utils.showToast("Vui lòng điền Tên rạp và Địa chỉ!", "error");
      return;
    }

    if (id) {
      DB.updateCinema(parseInt(id), { name, address, city, status });
      Utils.showToast(`Đã cập nhật cụm rạp "${name}" thành công!`, "success");
    } else {
      DB.addCinema({ name, address, city, status });
      Utils.showToast(`Đã thêm cụm rạp mới "${name}"!`, "success");
    }

    this.closeCinemaModal();
    this.renderTab('cinemas');
  },

  deleteCinema(id, name = '') {
    if (confirm(`Bạn có chắc chắn muốn xóa cụm rạp "${name}"?`)) {
      DB.deleteCinema(id);
      Utils.showToast("Đã xóa cụm rạp thành công!", "success");
      this.renderTab('cinemas');
    }
  },

  openAddScreenModal(cinemaId) {
    document.getElementById('screen-modal-title').textContent = "🎦 Thêm Phòng Chiếu Mới";
    document.getElementById('screen-id').value = "";
    document.getElementById('screen-cinema-id').value = cinemaId;
    document.getElementById('screen-name').value = "Phòng 03 - IMAX Laser";
    document.getElementById('screen-total-seats').value = "60";

    const modal = document.getElementById('screen-modal');
    if (modal) modal.classList.add('show');
  },

  openEditScreenModal(screenId) {
    const screens = DB.getAllScreens();
    const screen = screens.find(s => s.id == screenId);
    if (!screen) return;

    document.getElementById('screen-modal-title').textContent = `✏️ Sửa Phòng: ${screen.name}`;
    document.getElementById('screen-id').value = screen.id;
    document.getElementById('screen-cinema-id').value = screen.cinema_id;
    document.getElementById('screen-name').value = screen.name;
    document.getElementById('screen-total-seats').value = screen.total_seats || 60;

    const modal = document.getElementById('screen-modal');
    if (modal) modal.classList.add('show');
  },

  closeScreenModal() {
    const modal = document.getElementById('screen-modal');
    if (modal) modal.classList.remove('show');
  },

  saveScreen() {
    const id = document.getElementById('screen-id').value;
    const cinemaId = document.getElementById('screen-cinema-id').value;
    const name = document.getElementById('screen-name').value.trim();
    const totalSeats = parseInt(document.getElementById('screen-total-seats').value || 60);

    if (!name) {
      Utils.showToast("Vui lòng nhập tên phòng chiếu!", "error");
      return;
    }

    if (id) {
      DB.updateScreen(parseInt(id), { name, total_seats: totalSeats });
      Utils.showToast(`Đã cập nhật phòng chiếu "${name}" thành công!`, "success");
    } else {
      DB.addScreen({ cinema_id: parseInt(cinemaId), name, total_seats: totalSeats });
      Utils.showToast(`Đã thêm phòng chiếu "${name}"!`, "success");
    }

    this.closeScreenModal();
    this.renderTab('cinemas');
  },

  deleteScreen(id) {
    if (confirm("Bạn có chắc chắn muốn xóa phòng chiếu này?")) {
      DB.deleteScreen(id);
      Utils.showToast("Đã xóa phòng chiếu thành công!", "success");
      this.renderTab('cinemas');
    }
  },

  // --- BOOKINGS TAB ---
  renderBookingsTab(container) {
    const bookings = DB.getAllBookings();

    container.innerHTML = `
      <div class="data-card">
        <div class="data-card-header">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700;">Quản lý danh sách đơn đặt vé (${bookings.length} đơn)</h3>
          </div>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Phim & Rạp</th>
                <th>Suất Chiếu</th>
                <th>Ghế Chọn</th>
                <th>Tổng Tiền</th>
                <th>Thanh Toán</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              ${bookings.map(b => `
                <tr>
                  <td><strong style="color: var(--primary-gold);">${b.booking_code}</strong></td>
                  <td>
                    <div><strong>${b.customer_name}</strong></div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${b.customer_phone}</div>
                  </td>
                  <td>
                    <div style="font-weight: 600;">${b.movie_title}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${b.cinema_name} (${b.screen_name})</div>
                  </td>
                  <td>
                    <div>⏰ ${b.start_time}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${Utils.formatDate(b.show_date)}</div>
                  </td>
                  <td><strong style="color: var(--primary-gold);">${b.seats || 'Chưa chọn'}</strong></td>
                  <td><strong style="color: var(--accent-emerald);">${Utils.formatCurrency(b.total_amount)}</strong></td>
                  <td>
                    <span class="status-badge ${b.payment_status === 'paid' ? 'active' : 'pending'}">
                      ${b.payment_status === 'paid' ? '✓ Đã thanh toán' : '⏳ Chờ thanh toán'}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge ${b.status === 'confirmed' ? 'active' : 'pending'}">
                      ${b.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'}
                    </span>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-outline btn-sm" onclick="AdminApp.viewBookingDetails('${b.booking_code}')">👁️ Xem</button>
                      <button class="btn btn-secondary btn-sm" onclick="AdminApp.togglePaymentStatus(${b.id}, '${b.payment_status}')">💳 Đổi TT</button>
                      ${b.status === 'confirmed' ? `
                        <button class="btn btn-danger btn-sm" onclick="AdminApp.cancelBooking(${b.id})">❌ Hủy</button>
                      ` : ''}
                      <button class="btn btn-danger btn-sm" style="opacity: 0.7;" onclick="AdminApp.deleteBooking(${b.id})">🗑️ Xóa</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  viewBookingDetails(bookingCode) {
    const b = DB.getBookingByCode(bookingCode);
    if (!b) return;

    const modalBody = document.getElementById('booking-modal-body');
    const seatsStr = b.seats.map(s => s.seat_code).join(', ') || 'Chưa chọn';

    modalBody.innerHTML = `
      <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">MÃ ĐƠN HÀNG</span>
            <h4 style="font-size: 1.3rem; color: var(--primary-gold); font-weight: 800;">${b.booking_code}</h4>
          </div>
          <span class="status-badge ${b.status === 'confirmed' ? 'active' : 'pending'}">
            ${b.status === 'confirmed' ? '✓ ĐÃ XÁC NHẬN' : '❌ ĐÃ HỦY VÉ'}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; font-size: 0.9rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.8rem;">
          <div><strong>Khách hàng:</strong> ${b.customer_name}</div>
          <div><strong>Số điện thoại:</strong> ${b.customer_phone}</div>
          <div><strong>Phim chiếu:</strong> ${b.movie_title}</div>
          <div><strong>Rạp & Phòng:</strong> ${b.cinema_name} (${b.screen_name})</div>
          <div><strong>Suất chiếu:</strong> ${b.start_time} - ${Utils.formatDate(b.show_date)}</div>
          <div><strong>Vị trí ghế:</strong> <span style="color: var(--primary-gold); font-weight: 700;">💺 ${seatsStr}</span></div>
          <div><strong>Bắp nước:</strong> ${b.food_details || 'Không chọn'}</div>
          <div><strong>Hình thức TT:</strong> ${ (b.payment_method || 'MOMO').toUpperCase() }</div>
        </div>
      </div>

      <div style="background: rgba(212,175,55,0.05); border: 1px dashed var(--primary-gold); border-radius: 8px; padding: 1rem; margin-bottom: 1.2rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
          <span>Tiền vé xem phim:</span>
          <span>${Utils.formatCurrency(b.ticket_amount || 0)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
          <span>Combo Bắp nước:</span>
          <span>${Utils.formatCurrency(b.food_amount || 0)}</span>
        </div>
        ${b.discount_amount ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem; color: var(--accent-emerald);">
            <span>Giảm giá (${b.discount_code}):</span>
            <span>-${Utils.formatCurrency(b.discount_amount)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 0.6rem; font-size: 1.1rem; font-weight: 800;">
          <span>TỔNG THỰC THU:</span>
          <span style="color: var(--primary-gold);">${Utils.formatCurrency(b.total_amount)}</span>
        </div>
      </div>

      <div style="display: flex; gap: 0.8rem; justify-content: flex-end;">
        <button class="btn btn-secondary" onclick="AdminApp.closeBookingModal()">Đóng</button>
        ${b.status === 'confirmed' ? `
          <button class="btn btn-danger" onclick="AdminApp.cancelBooking(${b.id}); AdminApp.closeBookingModal();">❌ Hủy Vé Này</button>
        ` : ''}
      </div>
    `;

    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.add('show');
  },

  closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.remove('show');
  },

  togglePaymentStatus(bookingId, currentStatus) {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    DB.updateBookingPaymentStatus(bookingId, newStatus);
    Utils.showToast(`Đã đổi trạng thái thanh toán thành: ${newStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}!`, "success");
    this.renderTab('bookings');
  },

  cancelBooking(id) {
    if (confirm("Hủy đơn đặt vé này và giải phóng ghế lại cho hệ thống?")) {
      DB.updateBookingStatus(id, 'cancelled');
      Utils.showToast("Đã hủy đơn đặt vé thành công!", "success");
      this.renderTab('bookings');
    }
  },

  deleteBooking(id) {
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn lịch sử đơn đặt vé này khỏi database?")) {
      DB.deleteBooking(id);
      Utils.showToast("Đã xóa đơn đặt vé thành công!", "success");
      this.renderTab('bookings');
    }
  }
};
