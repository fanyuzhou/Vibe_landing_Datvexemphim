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

  init() {
    this.bindEvents();
    this.renderMovies();
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

    // Close Modal Event
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
