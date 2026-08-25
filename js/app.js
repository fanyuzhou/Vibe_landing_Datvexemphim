/**
 * Customer Homepage App Module — Ngọc Châu Cinema
 */

document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  App.init();
});

const App = {
  currentTab: 'now_showing',
  searchQuery: '',
  isLoggedIn: false,
  currentUser: null,

  init() {
    this.checkAuthStatus();
    this.bindEvents();
    this.renderMovies();
    this.renderAuthUI();
  },

  checkAuthStatus() {
    const saved = localStorage.getItem('ngoc_chau_customer');
    if (saved) {
      try {
        this.isLoggedIn = true;
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        this.isLoggedIn = false;
        this.currentUser = null;
      }
    } else {
      this.isLoggedIn = false;
      this.currentUser = null;
    }
  },

  renderAuthUI() {
    const container = document.getElementById('auth-nav-container');
    const adminNavLink = document.getElementById('nav-admin-link');

    const isAdminOrManagement = this.isLoggedIn && this.currentUser && ['admin', 'staff', 'sponsor'].includes(this.currentUser.role);

    // Link "Quản Trị Viên" directly to admin.html and sync active session
    if (adminNavLink) {
      if (this.isLoggedIn && this.currentUser && this.currentUser.role === 'user') {
        adminNavLink.style.display = 'none';
      } else {
        adminNavLink.style.display = 'inline-block';
        adminNavLink.href = 'admin.html';
        adminNavLink.onclick = () => {
          if (this.currentUser && ['admin', 'staff', 'sponsor'].includes(this.currentUser.role)) {
            sessionStorage.setItem('active_user', JSON.stringify(this.currentUser));
            sessionStorage.setItem('admin_logged_in', 'true');
          }
        };
      }
    }

    if (!container) return;

    if (this.isLoggedIn && this.currentUser) {
      container.innerHTML = `
        <div class="user-pill-container">
          <button type="button" class="user-pill-btn" onclick="App.toggleUserDropdown()">
            <span>👤 ${this.currentUser.full_name || 'Thành viên'}</span>
            <span style="font-size: 0.7rem;">▼</span>
          </button>
          <div class="user-dropdown-menu" id="user-dropdown-menu">
            <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); font-size: 0.8rem; color: var(--text-muted);">
              <div>${this.currentUser.email || this.currentUser.phone || 'Thành viên Ngọc Châu'}</div>
              <div style="font-size: 0.75rem; color: var(--primary-gold); margin-top: 0.2rem; font-weight: 700;">
                Quyền hạn: ${(this.currentUser.role || 'USER').toUpperCase()}
              </div>
            </div>
            ${isAdminOrManagement ? `
              <a href="admin.html" class="user-dropdown-item" style="color: var(--primary-gold);" onclick="sessionStorage.setItem('active_user', JSON.stringify(App.currentUser)); sessionStorage.setItem('admin_logged_in', 'true');">⚙️ Trang Quản Trị</a>
            ` : ''}
            <button type="button" class="user-dropdown-item" style="color: var(--accent-red);" onclick="App.handleLogout()">
              🚪 Đăng Xuất
            </button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" onclick="App.openAuthModal('login')">🔑 Đăng Nhập</button>
        <button type="button" class="btn btn-outline btn-sm" onclick="App.openAuthModal('register')">📝 Đăng Ký</button>
      `;
    }
  },

  toggleUserDropdown() {
    const menu = document.getElementById('user-dropdown-menu');
    if (menu) menu.classList.toggle('show');
  },

  openAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      this.switchAuthTab(mode);
      modal.classList.add('show');
    }
  },

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('show');
  },

  switchAuthTab(mode) {
    const loginBtn = document.getElementById('tab-login-btn');
    const regBtn = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('auth-login-form');
    const regForm = document.getElementById('auth-register-form');

    if (mode === 'login') {
      if (loginBtn) loginBtn.classList.add('active');
      if (regBtn) regBtn.classList.remove('active');
      if (loginForm) loginForm.style.display = 'block';
      if (regForm) regForm.style.display = 'none';
    } else {
      if (regBtn) regBtn.classList.add('active');
      if (loginBtn) loginBtn.classList.remove('active');
      if (regForm) regForm.style.display = 'block';
      if (loginForm) loginForm.style.display = 'none';
    }
  },

  handleLogin(emailOrPhone, password) {
    try {
      const user = DB.loginCustomer(emailOrPhone, password);
      if (user) {
        this.isLoggedIn = true;
        this.currentUser = user;
        localStorage.setItem('ngoc_chau_customer', JSON.stringify(user));
        Utils.showToast(`Đăng nhập thành công! Xin chào ${user.full_name}`, 'success');
        this.closeAuthModal();
        this.renderAuthUI();
      } else {
        Utils.showToast('Email/SĐT hoặc mật khẩu không chính xác!', 'error');
      }
    } catch (e) {
      Utils.showToast(e.message || 'Lỗi đăng nhập!', 'error');
    }
  },

  handleRegister(name, phone, email, password) {
    try {
      const user = DB.registerCustomer({ full_name: name, phone, email, password });
      this.isLoggedIn = true;
      this.currentUser = user;
      localStorage.setItem('ngoc_chau_customer', JSON.stringify(user));
      Utils.showToast(`Đăng ký thành công! Chào mừng ${user.full_name} đến với Ngọc Châu Cinema`, 'success');
      this.closeAuthModal();
      this.renderAuthUI();
    } catch (e) {
      Utils.showToast(e.message || 'Đăng ký thất bại!', 'error');
    }
  },

  handleLogout() {
    this.isLoggedIn = false;
    this.currentUser = null;
    localStorage.removeItem('ngoc_chau_customer');
    Utils.showToast('Đã đăng xuất tài khoản.', 'info');
    this.renderAuthUI();
  },

  bindEvents() {
    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    if (mobileBtn && navLinks) {
      mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('show');
      });
    }

    // Filter Tabs (Đang chiếu / Sắp chiếu)
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        filterTabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.currentTab = e.target.dataset.status;
        this.renderMovies();
      });
    });

    // Search Input
    const searchInput = document.getElementById('search-movie-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderMovies();
      });
    }

    // Close Movie Detail Modal Event
    const modalCloseBtn = document.getElementById('movie-modal-close');
    const modalBackdrop = document.getElementById('movie-modal');
    if (modalCloseBtn && modalBackdrop) {
      modalCloseBtn.addEventListener('click', () => {
        modalBackdrop.classList.remove('show');
      });
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          modalBackdrop.classList.remove('show');
        }
      });
    }

    // Auth Modal Close Event
    const authCloseBtn = document.getElementById('auth-modal-close');
    const authBackdrop = document.getElementById('auth-modal');
    if (authCloseBtn && authBackdrop) {
      authCloseBtn.addEventListener('click', () => this.closeAuthModal());
      authBackdrop.addEventListener('click', (e) => {
        if (e.target === authBackdrop) this.closeAuthModal();
      });
    }

    // Auth Forms Submit Handlers
    document.getElementById('auth-login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const loginInput = document.getElementById('auth-login-input').value.trim();
      const pass = document.getElementById('auth-login-pass').value.trim();
      if (loginInput) {
        this.handleLogin(loginInput, pass);
      }
    });

    document.getElementById('auth-register-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('auth-reg-name').value.trim();
      const phone = document.getElementById('auth-reg-phone').value.trim();
      const email = document.getElementById('auth-reg-email').value.trim();
      const pass = document.getElementById('auth-reg-pass').value.trim();
      if (name && (phone || email)) {
        this.handleRegister(name, phone, email, pass);
      }
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-pill-container')) {
        const menu = document.getElementById('user-dropdown-menu');
        if (menu) menu.classList.remove('show');
      }
    });
  },

  renderMovies() {
    const grid = document.getElementById('movie-grid');
    if (!grid) return;

    let movies = DB.getMovies(this.currentTab);

    // Apply Search Filter
    if (this.searchQuery) {
      movies = movies.filter(m => 
        m.title.toLowerCase().includes(this.searchQuery) ||
        (m.genre && m.genre.toLowerCase().includes(this.searchQuery))
      );
    }

    if (!movies.length) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">Không tìm thấy phim phù hợp</p>
          <p style="font-size: 0.9rem;">Thử từ khóa khác hoặc chuyển tab "Đang chiếu" / "Sắp chiếu"</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = movies.map(m => `
      <div class="movie-card">
        <div class="movie-poster-wrap">
          <span class="badge badge-age movie-age-tag">${m.age_rating || 'P'}</span>
          <span class="movie-duration-tag">⏱️ ${m.duration_minutes || 120} phút</span>
          <img src="${m.poster_url}" alt="${m.title}" class="movie-poster" loading="lazy">
        </div>
        <div class="movie-card-body">
          <div class="movie-genre">${m.genre || 'Điện ảnh'}</div>
          <h3 class="movie-title">${m.title}</h3>
          <div class="movie-card-footer">
            <button class="btn btn-outline btn-sm" onclick="App.openMovieDetail(${m.id})">Chi tiết</button>
            <a href="booking.html?movie_id=${m.id}" class="btn btn-primary btn-sm">Đặt vé</a>
          </div>
        </div>
      </div>
    `).join('');
  },

  openMovieDetail(movieId) {
    const movie = DB.getMovieById(movieId);
    if (!movie) return;

    const modal = document.getElementById('movie-modal');
    const content = document.getElementById('movie-modal-body');
    if (!modal || !content) return;

    const showtimes = DB.getShowtimes(movieId);

    content.innerHTML = `
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
        <img src="${movie.poster_url}" alt="${movie.title}" style="width: 180px; height: 260px; object-fit: cover; border-radius: var(--radius-md); box-shadow: var(--shadow-md);">
        <div style="flex: 1; min-width: 250px;">
          <h2 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--primary-gold);">${movie.title}</h2>
          <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem;">
            <span class="badge badge-age">${movie.age_rating || 'P'}</span>
            <span style="color: var(--text-secondary); font-size: 0.9rem;">⏱️ ${movie.duration_minutes} phút</span>
            <span style="color: var(--primary-gold); font-size: 0.9rem;">🏷️ ${movie.genre}</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.25rem;">
            ${movie.description}
          </p>
          <p style="font-size: 0.85rem; color: var(--text-muted);">🗓️ Khởi chiếu: ${Utils.formatDate(movie.release_date)}</p>
        </div>
      </div>

      <div style="border-top: 1px solid var(--border-color); padding-top: 1.25rem;">
        <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-primary);">🎬 Lịch chiếu khả dụng</h4>
        ${showtimes.length ? `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${showtimes.slice(0, 5).map(st => `
              <div style="display: flex; align-items: center; justify-content: space-between; background-color: var(--bg-card); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <div>
                  <div style="font-weight: 700; color: var(--text-primary);">${st.cinema_name} — ${st.screen_name}</div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary);">${Utils.formatDate(st.show_date)} | Suất <strong>${st.start_time}</strong></div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <span style="font-weight: 700; color: var(--primary-gold);">${Utils.formatCurrency(st.base_price)}</span>
                  <a href="booking.html?showtime_id=${st.id}" class="btn btn-primary btn-sm">Đặt vé</a>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <p style="color: var(--text-muted); font-size: 0.9rem;">Hiện chưa có lịch chiếu cho phim này.</p>
        `}
      </div>
    `;

    modal.classList.add('show');
  }
};
