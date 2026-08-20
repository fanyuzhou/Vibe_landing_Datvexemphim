/**
 * Step-by-Step Booking Controller — Module 1 & Module 2 (Payment Gateways & Direct E-Ticket Redirection) — Ngọc Châu Cinema
 */

document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  BookingApp.init();
});

const BookingApp = {
  currentStep: 1,
  selectedMovieId: null,
  selectedCinemaId: null,
  selectedShowtimeId: null,
  selectedDate: null,
  foodCart: {}, // { foodId: quantity }
  appliedPromo: null,
  selectedPaymentMethod: 'momo',
  isCustomerLoggedIn: false,
  loggedInCustomer: null,
  customerName: '',
  customerPhone: '',
  customerEmail: '',

  init() {
    this.checkCustomerLoginStatus();

    const params = Utils.getQueryParams();
    if (params.movie_id) this.selectedMovieId = parseInt(params.movie_id);
    if (params.showtime_id) {
      this.selectedShowtimeId = parseInt(params.showtime_id);
      const st = DB.getShowtimeById(this.selectedShowtimeId);
      if (st) {
        this.selectedMovieId = st.movie_id;
        this.selectedCinemaId = st.cinema_id;
        this.selectedDate = st.show_date;
      }
    }

    this.bindEvents();
    this.renderCurrentStep();
  },

  checkCustomerLoginStatus() {
    const saved = localStorage.getItem('ngoc_chau_customer');
    if (saved) {
      this.isCustomerLoggedIn = true;
      this.loggedInCustomer = JSON.parse(saved);
      this.customerName = this.loggedInCustomer.full_name;
      this.customerPhone = this.loggedInCustomer.phone;
      this.customerEmail = this.loggedInCustomer.email;
    }
  },

  customerLogin(emailOrPhone, password) {
    const cust = DB.findCustomerByEmailOrPhone(emailOrPhone);
    if (cust) {
      this.isCustomerLoggedIn = true;
      this.loggedInCustomer = cust;
      this.customerName = cust.full_name;
      this.customerPhone = cust.phone;
      this.customerEmail = cust.email;
      localStorage.setItem('ngoc_chau_customer', JSON.stringify(cust));
      Utils.showToast(`Đăng nhập thành công! Xin chào ${cust.full_name}`, 'success');
      this.closeLoginModal();
      this.renderCurrentStep();
      return true;
    } else {
      const newCust = {
        id: Date.now(),
        full_name: emailOrPhone.includes('@') ? emailOrPhone.split('@')[0] : 'Khách hàng',
        email: emailOrPhone.includes('@') ? emailOrPhone : 'khach@gmail.com',
        phone: emailOrPhone.includes('@') ? '0901234567' : emailOrPhone
      };
      this.isCustomerLoggedIn = true;
      this.loggedInCustomer = newCust;
      this.customerName = newCust.full_name;
      this.customerPhone = newCust.phone;
      this.customerEmail = newCust.email;
      localStorage.setItem('ngoc_chau_customer', JSON.stringify(newCust));
      Utils.showToast(`Đăng nhập thành công! Xin chào ${newCust.full_name}`, 'success');
      this.closeLoginModal();
      this.renderCurrentStep();
      return true;
    }
  },

  customerLogout() {
    this.isCustomerLoggedIn = false;
    this.loggedInCustomer = null;
    this.appliedPromo = null;
    localStorage.removeItem('ngoc_chau_customer');
    Utils.showToast('Đã đăng xuất tài khoản.', 'info');
    this.renderCurrentStep();
  },

  openLoginModal() {
    const modal = document.getElementById('customer-login-modal');
    if (modal) modal.classList.add('show');
  },

  closeLoginModal() {
    const modal = document.getElementById('customer-login-modal');
    if (modal) modal.classList.remove('show');
  },

  bindEvents() {
    document.getElementById('btn-prev-step')?.addEventListener('click', () => this.prevStep());
    document.getElementById('btn-next-step')?.addEventListener('click', () => this.nextStep());

    document.getElementById('customer-login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const loginInput = document.getElementById('cust-login-input').value.trim();
      if (loginInput) {
        this.customerLogin(loginInput, '123456');
      }
    });

    document.getElementById('modal-cust-login-close')?.addEventListener('click', () => this.closeLoginModal());
  },

  setStep(step) {
    this.currentStep = step;
    
    document.querySelectorAll('.step-item').forEach((el, idx) => {
      const stepNum = idx + 1;
      el.classList.remove('active', 'completed');
      if (stepNum === this.currentStep) el.classList.add('active');
      else if (stepNum < this.currentStep) el.classList.add('completed');
    });

    this.renderCurrentStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  prevStep() {
    if (this.currentStep > 1) {
      this.setStep(this.currentStep - 1);
    }
  },

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.selectedMovieId || !this.selectedShowtimeId) {
        Utils.showToast('Vui lòng chọn suất chiếu!', 'error');
        return;
      }
      this.setStep(2);
      return;
    }

    if (this.currentStep === 2) {
      if (Seats.getSelectedSeats().length === 0) {
        Utils.showToast('Vui lòng chọn ít nhất 1 ghế xem phim!', 'error');
        return;
      }
      this.setStep(3);
      return;
    }

    if (this.currentStep === 4) {
      const name = document.getElementById('cust-fullname')?.value?.trim();
      const phone = document.getElementById('cust-phone')?.value?.trim();
      const email = document.getElementById('cust-email')?.value?.trim();
      if (!name || !phone) {
        Utils.showToast('Vui lòng nhập đầy đủ Họ tên và Số điện thoại!', 'error');
        return;
      }
      this.customerName = name;
      this.customerPhone = phone;
      this.customerEmail = email || '';
    }

    if (this.currentStep === 5) {
      this.confirmBooking();
      return;
    }

    if (this.currentStep < 5) {
      this.setStep(this.currentStep + 1);
    }
  },

  renderCurrentStep() {
    const stepContainer = document.getElementById('booking-step-content');
    if (!stepContainer) return;

    if (this.currentStep === 1) {
      this.renderStep1(stepContainer);
    } else if (this.currentStep === 2) {
      this.renderStep2(stepContainer);
    } else if (this.currentStep === 3) {
      this.renderStep3_FB(stepContainer);
    } else if (this.currentStep === 4) {
      this.renderStep4_PromoAndInfo(stepContainer);
    } else if (this.currentStep === 5) {
      this.renderStep5_Payment(stepContainer);
    }

    this.updateSummaryCard();
  },

  // Step 1: Movie & Showtime Selection
  renderStep1(container) {
    const movies = DB.getMovies();
    if (!this.selectedMovieId && movies.length) this.selectedMovieId = movies[0].id;

    const selectedMovie = DB.getMovieById(this.selectedMovieId);
    const showtimes = DB.getShowtimes(this.selectedMovieId);
    const dates = [...new Set(showtimes.map(st => st.show_date))].sort();

    if (dates.length && (!this.selectedDate || !dates.includes(this.selectedDate))) {
      this.selectedDate = dates[0];
    }

    const filteredShowtimes = showtimes.filter(st => st.show_date === this.selectedDate);

    const cinemaMap = {};
    filteredShowtimes.forEach(st => {
      if (!cinemaMap[st.cinema_name]) {
        cinemaMap[st.cinema_name] = {
          name: st.cinema_name,
          address: st.cinema_address,
          screen: st.screen_name,
          times: []
        };
      }
      cinemaMap[st.cinema_name].times.push(st);
    });

    const isValidShowtime = filteredShowtimes.some(st => st.id === this.selectedShowtimeId);
    if (!isValidShowtime && filteredShowtimes.length) {
      this.selectedShowtimeId = filteredShowtimes[0].id;
    } else if (!filteredShowtimes.length) {
      this.selectedShowtimeId = null;
    }

    container.innerHTML = `
      <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--primary-gold);">1. Chọn Phim & Suất Chiếu</h3>

      <!-- Select Movie Selector Carousel -->
      <div style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; margin-bottom: 1.5rem;">
        ${movies.map(m => `
          <div onclick="BookingApp.selectMovie(${m.id})" 
               style="min-width: 140px; cursor: pointer; text-align: center; border-radius: var(--radius-md); padding: 0.5rem; border: 2px solid ${this.selectedMovieId === m.id ? 'var(--primary-gold)' : 'transparent'}; background: var(--bg-surface);">
            <img src="${m.poster_url}" alt="${m.title}" style="width: 100%; height: 180px; object-fit: cover; border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
            <div style="font-weight: 700; font-size: 0.85rem; color: ${this.selectedMovieId === m.id ? 'var(--primary-gold)' : 'var(--text-primary)'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.title}</div>
          </div>
        `).join('')}
      </div>

      ${dates.length ? `
        <!-- Select Date Tabs -->
        <div style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 1rem; margin-bottom: 1.5rem;">
          ${dates.map(date => `
            <button type="button" class="btn ${this.selectedDate === date ? 'btn-primary' : 'btn-secondary'}"
                    onclick="BookingApp.selectDate('${date}')">
              📅 ${Utils.formatDate(date)}
            </button>
          `).join('')}
        </div>

        <!-- Grouped Showtimes per Cinema -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${Object.values(cinemaMap).length ? Object.values(cinemaMap).map(cinema => `
            <div style="background-color: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
              <div style="margin-bottom: 1rem;">
                <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--primary-gold);">${cinema.name}</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted);">${cinema.address} — ${cinema.screen}</p>
              </div>

              <div style="display: flex; gap: 0.85rem; flex-wrap: wrap;">
                ${cinema.times.map(st => {
                  const isSel = (this.selectedShowtimeId === st.id);
                  return `
                    <button type="button" 
                            class="btn ${isSel ? 'btn-primary' : 'btn-secondary'}"
                            style="padding: 0.75rem 1.25rem; font-size: 0.95rem; ${isSel ? 'border-color: var(--primary-gold); box-shadow: var(--shadow-gold);' : ''}"
                            onclick="BookingApp.selectShowtime(${st.id})">
                      ⏰ <strong>Suất ${st.start_time}</strong> (${Utils.formatCurrency(st.base_price)}) ${isSel ? '✓' : ''}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('') : '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Chưa có lịch chiếu cho ngày này.</p>'}
        </div>
      ` : `
        <div style="background-color: var(--bg-surface); padding: 2.5rem; text-align: center; border-radius: var(--radius-lg); border: 1px dashed var(--border-color-gold); margin-top: 1rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎬</div>
          <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--primary-gold); margin-bottom: 0.5rem;">Phim "${selectedMovie ? selectedMovie.title : ''}" Chưa Có Suất Chiếu</h4>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.25rem;">Phim này đang cập nhật lịch chiếu. Vui lòng chọn phim khác bên trên hoặc mở trang Quản lý Suất chiếu trong Admin để thêm lịch chiếu!</p>
          ${movies.length > 1 ? `
            <button type="button" class="btn btn-primary" onclick="BookingApp.selectMovie(${movies.find(m => m.id !== this.selectedMovieId)?.id || movies[0].id})">
              🍿 Chọn Phim Khác Có Lịch Chiếu
            </button>
          ` : ''}
        </div>
      `}
    `;
  },

  selectMovie(movieId) {
    this.selectedMovieId = movieId;
    const showtimes = DB.getShowtimes(movieId);
    const dates = [...new Set(showtimes.map(st => st.show_date))].sort();
    if (dates.length) {
      this.selectedDate = dates[0];
      const filtered = showtimes.filter(st => st.show_date === this.selectedDate);
      if (filtered.length) this.selectedShowtimeId = filtered[0].id;
    } else {
      this.selectedDate = null;
      this.selectedShowtimeId = null;
    }
    this.renderCurrentStep();
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    const showtimes = DB.getShowtimes(this.selectedMovieId);
    const filtered = showtimes.filter(st => st.show_date === dateStr);
    if (filtered.length) {
      this.selectedShowtimeId = filtered[0].id;
    } else {
      this.selectedShowtimeId = null;
    }
    this.renderCurrentStep();
  },

  selectShowtime(showtimeId) {
    this.selectedShowtimeId = showtimeId;
    this.setStep(2);
  },


  // Step 2: Interactive Seat Map
  renderStep2(container) {
    const showtime = DB.getShowtimeById(this.selectedShowtimeId);
    if (!showtime) return;

    const selectedSeats = Seats.getSelectedSeats();

    container.innerHTML = `
      <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary-gold);">2. Chọn Ghế Xem Phim</h3>
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${showtime.movie_title} — ${showtime.cinema_name} (${showtime.screen_name}) | Suất ${showtime.start_time}</p>

      <div id="seat-map-wrapper"></div>

      <!-- Live Seat Summary & Proceed Bar -->
      <div id="seat-action-bar" style="background-color: var(--bg-surface); padding: 1.25rem 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color-gold); margin-top: 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: var(--shadow-gold);">
        <div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">DANH SÁCH GHẾ ĐÃ CHỌN:</div>
          <div id="seat-action-summary" style="font-size: 1.15rem; font-weight: 800; color: var(--primary-gold);">
            ${selectedSeats.length ? `${selectedSeats.map(s => s.seat_code).join(', ')} (${selectedSeats.length} ghế)` : 'Chưa chọn ghế nào'}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 1.5rem;">
          <div style="text-align: right;">
            <div style="font-size: 0.85rem; color: var(--text-muted);">TẠM TÍNH VÉ:</div>
            <div id="seat-action-total" style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary);">
              ${Utils.formatCurrency(Seats.getTotalPrice())}
            </div>
          </div>
          <button type="button" class="btn ${selectedSeats.length ? 'btn-primary' : 'btn-secondary'} btn-lg" 
                  id="btn-proceed-to-fb"
                  onclick="BookingApp.proceedToFoodStep()"
                  ${!selectedSeats.length ? 'disabled' : ''}>
            🍿 TIẾP TỤC ĐẶT BẮP NƯỚC →
          </button>
        </div>
      </div>
    `;

    const seatsData = DB.getSeatsByScreenAndShowtime(showtime.screen_id, this.selectedShowtimeId);
    Seats.init('seat-map-wrapper', seatsData, showtime.base_price, () => {
      this.updateSummaryCard();
    });
  },

  proceedToFoodStep() {
    if (Seats.getSelectedSeats().length === 0) {
      Utils.showToast('Vui lòng chọn ít nhất 1 ghế xem phim!', 'error');
      return;
    }
    this.setStep(3);
  },

  // Step 3: F&B Selection
  renderStep3_FB(container) {
    const foodItems = DB.getFoodItems();

    container.innerHTML = `
      <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary-gold);">3. Chọn Đồ Ăn & Thức Uống (F&B)</h3>
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Bắp rang bơ giòn rụm & nước ngọt mát lạnh chờ bạn thưởng thức tại rạp!</p>

      <div class="food-grid">
        ${foodItems.map(f => {
          const qty = this.foodCart[f.id] || 0;
          return `
            <div class="food-card">
              <div class="food-icon">${f.image_url}</div>
              <div class="food-info">
                <div class="food-name">${f.name}</div>
                <div class="food-desc">${f.description}</div>
                <div class="food-price">${Utils.formatCurrency(f.price)}</div>
              </div>
              <div class="qty-control">
                <button type="button" class="qty-btn" onclick="BookingApp.updateFoodQty(${f.id}, -1)">-</button>
                <span class="qty-val">${qty}</span>
                <button type="button" class="qty-btn" onclick="BookingApp.updateFoodQty(${f.id}, 1)">+</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 2rem;">
        <button type="button" class="btn btn-primary btn-lg" onclick="BookingApp.setStep(4)">🎁 TIẾP TỤC ĐẾN MÃ GIẢM GIÁ →</button>
      </div>
    `;
  },

  updateFoodQty(foodId, change) {
    const current = this.foodCart[foodId] || 0;
    const updated = Math.max(0, current + change);
    if (updated === 0) {
      delete this.foodCart[foodId];
    } else {
      this.foodCart[foodId] = updated;
    }
    this.renderCurrentStep();
  },

  // Step 4: Login Banner + Promo Code + Customer Info
  renderStep4_PromoAndInfo(container) {
    const defaultName = this.customerName || (this.loggedInCustomer ? this.loggedInCustomer.full_name : 'Nguyễn Văn An');
    const defaultPhone = this.customerPhone || (this.loggedInCustomer ? this.loggedInCustomer.phone : '0901234567');
    const defaultEmail = this.customerEmail || (this.loggedInCustomer ? this.loggedInCustomer.email : 'an.nguyen@gmail.com');

    container.innerHTML = `
      <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--primary-gold);">4. Mã Giảm Giá & Thông Tin Nhận Vé</h3>

      <!-- Customer Login Banner -->
      <div class="login-required-banner">
        ${this.isCustomerLoggedIn ? `
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.5rem;">👤</span>
            <div>
              <div style="font-weight: 700; color: var(--primary-gold);">Thành viên: ${this.loggedInCustomer.full_name}</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">${this.loggedInCustomer.phone || this.loggedInCustomer.email}</div>
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="BookingApp.customerLogout()">Đăng xuất</button>
        ` : `
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.5rem;">🔒</span>
            <div>
              <div style="font-weight: 700; color: var(--primary-gold);">Yêu cầu Đăng nhập để áp dụng Mã giảm giá</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">Đăng nhập tài khoản thành viên Ngọc Châu Cinema để nhận ưu đãi giảm tới 20% đơn hàng.</div>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="BookingApp.openLoginModal()">🔑 Đăng Nhập Ngay</button>
        `}
      </div>

      <!-- Promo Code Area -->
      <div style="background-color: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); margin-bottom: 2rem;">
        <h4 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary);">🎁 Mã Giảm Giá Ưu Đãi</h4>
        
        <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
          <input type="text" id="promo-code-input" class="form-control" placeholder="Nhập mã (Ví dụ: NGOCCHAU10, TIETKIEM50K)..." 
                 value="${this.appliedPromo ? this.appliedPromo.code : ''}" 
                 ${!this.isCustomerLoggedIn ? 'disabled title="Vui lòng đăng nhập để nhập mã giảm giá"' : ''}>
          <button type="button" class="btn ${this.isCustomerLoggedIn ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="BookingApp.applyPromoCode()"
                  ${!this.isCustomerLoggedIn ? 'disabled' : ''}>
            Áp Dụng
          </button>
        </div>

        ${this.appliedPromo ? `
          <div style="color: var(--accent-emerald); font-size: 0.9rem; font-weight: 600;">
            ✓ Đã áp dụng mã <strong>${this.appliedPromo.code}</strong> (${this.appliedPromo.description})
            <button type="button" style="color: var(--accent-red); margin-left: 0.75rem; font-size: 0.85rem; text-decoration: underline;" onclick="BookingApp.removePromoCode()">Hủy mã</button>
          </div>
        ` : `
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            💡 Mã gợi ý: <code>NGOCCHAU10</code> (Giảm 10%), <code>VIPCINEMA20</code> (Giảm 20%), <code>TIETKIEM50K</code> (Giảm 50.000 ₫)
          </div>
        `}
      </div>

      <!-- Customer Details Form -->
      <div style="background-color: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <h4 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary);">👤 Thông Tin Khách Hàng Nhận Vé</h4>
        <div class="form-group">
          <label class="form-label" for="cust-fullname">Họ và tên <span style="color: var(--accent-red);">*</span></label>
          <input type="text" id="cust-fullname" class="form-control" placeholder="Ví dụ: Nguyễn Văn An" value="${defaultName}" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="cust-phone">Số điện thoại nhận SMS vé <span style="color: var(--accent-red);">*</span></label>
          <input type="tel" id="cust-phone" class="form-control" placeholder="Ví dụ: 0901234567" value="${defaultPhone}" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="cust-email">Email nhận vé điện tử</label>
          <input type="email" id="cust-email" class="form-control" placeholder="Ví dụ: nguyenvanan@gmail.com" value="${defaultEmail}">
        </div>
      </div>
    `;
  },

  applyPromoCode() {
    if (!this.isCustomerLoggedIn) {
      Utils.showToast('Bạn cần ĐĂNG NHẬP để áp dụng mã giảm giá!', 'error');
      this.openLoginModal();
      return;
    }

    const input = document.getElementById('promo-code-input')?.value.trim();
    if (!input) {
      Utils.showToast('Vui lòng nhập mã giảm giá!', 'error');
      return;
    }

    const promo = DB.getPromotionByCode(input);
    if (!promo) {
      Utils.showToast('Mã giảm giá không tồn tại hoặc đã hết hạn!', 'error');
      return;
    }

    const subtotal = this.calculateSubtotal();
    if (promo.min_order_amount && subtotal < promo.min_order_amount) {
      Utils.showToast(`Đơn hàng phải từ ${Utils.formatCurrency(promo.min_order_amount)} để dùng mã này!`, 'error');
      return;
    }

    this.appliedPromo = promo;
    Utils.showToast(`Áp dụng mã ${promo.code} thành công!`, 'success');
    this.renderCurrentStep();
  },

  removePromoCode() {
    this.appliedPromo = null;
    Utils.showToast('Đã hủy áp dụng mã giảm giá.', 'info');
    this.renderCurrentStep();
  },

  // Module 2 — Step 5: Enhanced Multi-Channel Payment Module
  renderStep5_Payment(container) {
    const movie = DB.getMovieById(this.selectedMovieId);
    const showtime = DB.getShowtimeById(this.selectedShowtimeId);
    const selectedSeats = Seats.getSelectedSeats();
    const totals = this.calculateFinalTotals();
    const foodList = this.getFoodSelectionList();

    let paymentInteractiveContent = '';

    if (this.selectedPaymentMethod === 'momo') {
      paymentInteractiveContent = `
        <div style="background-color: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color-gold); text-align: center;">
          <div style="font-weight: 700; color: var(--primary-gold); margin-bottom: 0.5rem; font-size: 1.1rem;">📱 Thanh Toán Qua Ví Điện Tử MoMo</div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem;">Mở ứng dụng MoMo trên điện thoại và quét mã QR Code để hoàn tất thanh toán.</p>
          
          <div class="qr-scanner-box">
            <div class="qr-scanner-line"></div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MOMO-NGOCCHAU-CINEMA-${totals.finalTotal}" alt="MoMo QR Code" style="width: 100%; height: 100%; object-fit: contain;">
          </div>

          <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);">
            ⏳ Thời gian giữ vé: <strong style="color: var(--primary-gold);" id="momo-timer">04:59</strong>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
            Chủ tài khoản: <strong>NGỌC CHÂU CINEMA CORP</strong> — Số tiền: <strong style="color: var(--primary-gold);">${Utils.formatCurrency(totals.finalTotal)}</strong>
          </div>
        </div>
      `;
    } else if (this.selectedPaymentMethod === 'zalopay') {
      paymentInteractiveContent = `
        <div style="background-color: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); text-align: center;">
          <div style="font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem; font-size: 1.1rem;">🔵 Thanh Toán Qua ZaloPay / VNPay QR</div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem;">Hỗ trợ tất cả 34+ Ứng dụng Ngân hàng (Vietcombank, MB Bank, Techcombank, ACB...)</p>
          
          <div class="qr-scanner-box" style="border-color: #3b82f6;">
            <div class="qr-scanner-line" style="background: #3b82f6; box-shadow: 0 0 10px #3b82f6;"></div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=VNPAY-NGOCCHAU-${totals.finalTotal}" alt="VNPay QR Code" style="width: 100%; height: 100%; object-fit: contain;">
          </div>

          <div style="display: flex; justify-content: center; gap: 0.75rem; margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted);">
            <span>🏦 Vietcombank</span> • <span>🏦 MB Bank</span> • <span>🏦 Techcombank</span> • <span>🏦 ACB</span>
          </div>
        </div>
      `;
    } else if (this.selectedPaymentMethod === 'card') {
      paymentInteractiveContent = `
        <div style="background-color: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
          <h4 style="font-weight: 700; color: var(--primary-gold); margin-bottom: 1rem;">💳 Thẻ Ngân Hàng ATM / Visa / Mastercard</h4>

          <!-- Live Credit Card Visual Preview -->
          <div class="credit-card-preview">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div class="card-chip"></div>
              <div style="font-weight: 800; color: var(--primary-gold); font-size: 1.1rem; letter-spacing: 1px;">NGỌC CHÂU CARD</div>
            </div>
            <div class="card-number-display" id="card-num-preview">•••• •••• •••• ••••</div>
            <div class="card-details-row">
              <div>
                <div style="font-size: 0.65rem; color: var(--text-muted);">CHỦ THẺ</div>
                <div class="card-holder-display" id="card-holder-preview">NGUYEN VAN AN</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.65rem; color: var(--text-muted);">HẾT HẠN</div>
                <div class="card-expiry-display" id="card-exp-preview">12/28</div>
              </div>
            </div>
          </div>

          <!-- Card Form Inputs -->
          <div class="form-group">
            <label class="form-label" for="card-num-input">Số thẻ ngân hàng (16 chữ số)</label>
            <input type="text" id="card-num-input" class="form-control" placeholder="9704 1234 5678 9012" maxlength="19" value="9704 1234 5678 9012" oninput="BookingApp.updateCardPreview()">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="card-holder-input">Tên in trên thẻ</label>
              <input type="text" id="card-holder-input" class="form-control" placeholder="NGUYEN VAN AN" value="NGUYEN VAN AN" oninput="BookingApp.updateCardPreview()">
            </div>
            <div class="form-group">
              <label class="form-label" for="card-exp-input">Tháng/Năm (MM/YY)</label>
              <input type="text" id="card-exp-input" class="form-control" placeholder="12/28" maxlength="5" value="12/28" oninput="BookingApp.updateCardPreview()">
            </div>
            <div class="form-group">
              <label class="form-label" for="card-cvv-input">Mã CVV/CVC</label>
              <input type="password" id="card-cvv-input" class="form-control" placeholder="123" maxlength="4" value="123">
            </div>
          </div>
        </div>
      `;
    } else if (this.selectedPaymentMethod === 'cash') {
      paymentInteractiveContent = `
        <div style="background-color: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💵</div>
          <div style="font-weight: 700; color: var(--primary-gold); margin-bottom: 0.5rem; font-size: 1.1rem;">Thanh Toán & Nhận Vé Tại Quầy Rạp</div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
            Vé của bạn sẽ được giữ chỗ trong <strong>30 phút</strong>. Vui lòng đến trước giờ chiếu 15 phút, đọc Mã Vé Điện Tử tại quầy vé <strong>${showtime ? showtime.cinema_name : 'Ngọc Châu Cinema'}</strong> để nhận vé giấy và thanh toán tiền mặt.
          </p>
        </div>
      `;
    }

    container.innerHTML = `
      <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--primary-gold);">5. Chọn Phương Thức Thanh Toán</h3>

      <!-- Payment Method Cards Grid -->
      <div style="margin-bottom: 1.5rem;">
        <h4 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 1rem;">Phương thức thanh toán:</h4>
        <div class="payment-grid">
          <div class="payment-card ${this.selectedPaymentMethod === 'momo' ? 'selected' : ''}" onclick="BookingApp.selectPaymentMethod('momo')">
            <div class="payment-icon">📱</div>
            <div>
              <div class="payment-name">Ví Điện Tử MoMo</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Quét mã QR MoMo</div>
            </div>
          </div>

          <div class="payment-card ${this.selectedPaymentMethod === 'zalopay' ? 'selected' : ''}" onclick="BookingApp.selectPaymentMethod('zalopay')">
            <div class="payment-icon">🔵</div>
            <div>
              <div class="payment-name">ZaloPay / VNPay QR</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">App Ngân hàng quét QR</div>
            </div>
          </div>

          <div class="payment-card ${this.selectedPaymentMethod === 'card' ? 'selected' : ''}" onclick="BookingApp.selectPaymentMethod('card')">
            <div class="payment-icon">💳</div>
            <div>
              <div class="payment-name">Thẻ ATM / Visa / Master</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Thẻ ngân hàng nội địa</div>
            </div>
          </div>

          <div class="payment-card ${this.selectedPaymentMethod === 'cash' ? 'selected' : ''}" onclick="BookingApp.selectPaymentMethod('cash')">
            <div class="payment-icon">💵</div>
            <div>
              <div class="payment-name">Thanh Toán Tại Rạp</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Trả tiền mặt tại quầy vé</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Method Interactive Area -->
      <div style="margin-bottom: 2rem;">
        ${paymentInteractiveContent}
      </div>

      <!-- Final Invoice Review Card -->
      <div style="background-color: var(--bg-surface); padding: 2rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color-gold); box-shadow: var(--shadow-gold);">
        <h4 style="font-size: 1.25rem; font-weight: 800; color: var(--primary-gold); margin-bottom: 1rem;">Chi Tiết Hóa Đơn Đặt Vé</h4>
        
        <div style="display: flex; gap: 1.25rem; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
          <img src="${movie ? movie.poster_url : ''}" alt="${movie ? movie.title : ''}" style="width: 90px; height: 130px; object-fit: cover; border-radius: var(--radius-md);">
          <div>
            <h5 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">${movie ? movie.title : ''}</h5>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">🏛️ ${showtime ? showtime.cinema_name : ''} (${showtime ? showtime.screen_name : ''})</p>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">📅 Suất ${showtime ? showtime.start_time : ''} — Ngày ${showtime ? Utils.formatDate(showtime.show_date) : ''}</p>
            <p style="font-size: 0.9rem; color: var(--primary-gold); font-weight: 700;">💺 Ghế: ${selectedSeats.map(s => s.seat_code).join(', ')} (${selectedSeats.length} ghế)</p>
          </div>
        </div>

        <!-- Detailed Item Breakdown -->
        <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.95rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Tiền vé xem phim (${selectedSeats.length} ghế):</span>
            <span style="font-weight: 600;">${Utils.formatCurrency(totals.ticketAmount)}</span>
          </div>

          ${foodList.length ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Đồ ăn & Thức uống (${foodList.map(f => `${f.name} x${f.quantity}`).join(', ')}):</span>
              <span style="font-weight: 600;">${Utils.formatCurrency(totals.foodAmount)}</span>
            </div>
          ` : ''}

          ${this.appliedPromo ? `
            <div style="display: flex; justify-content: space-between; color: var(--accent-emerald);">
              <span>Giảm giá mã ${this.appliedPromo.code}:</span>
              <span style="font-weight: 700;">-${Utils.formatCurrency(totals.discountAmount)}</span>
            </div>
          ` : ''}
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 1rem; border-top: 2px stroke var(--border-color);">
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">TỔNG TÍNH THANH TOÁN:</span>
            <div style="font-size: 1.85rem; font-weight: 800; color: var(--primary-gold);">${Utils.formatCurrency(totals.finalTotal)}</div>
          </div>
          <button type="button" class="btn btn-primary btn-lg" onclick="BookingApp.confirmBooking()">💳 THANH TOÁN & NHẬN VÉ NGAY (PDF)</button>
        </div>
      </div>
    `;

    if (this.selectedPaymentMethod === 'momo') {
      this.startMoMoTimer();
    }
  },

  selectPaymentMethod(method) {
    this.selectedPaymentMethod = method;
    this.renderCurrentStep();
  },

  updateCardPreview() {
    const numInput = document.getElementById('card-num-input')?.value || '•••• •••• •••• ••••';
    const holderInput = document.getElementById('card-holder-input')?.value || 'NGUYEN VAN AN';
    const expInput = document.getElementById('card-exp-input')?.value || '12/28';

    const numPrev = document.getElementById('card-num-preview');
    const holderPrev = document.getElementById('card-holder-preview');
    const expPrev = document.getElementById('card-exp-preview');

    if (numPrev) numPrev.textContent = numInput || '•••• •••• •••• ••••';
    if (holderPrev) holderPrev.textContent = (holderInput || 'NGUYEN VAN AN').toUpperCase();
    if (expPrev) expPrev.textContent = expInput || '12/28';
  },

  startMoMoTimer() {
    let timeLeft = 300; // 5 minutes
    const timerEl = document.getElementById('momo-timer');
    if (!timerEl) return;

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(this.timerInterval);
        if (timerEl) timerEl.textContent = "Hết thời gian!";
        return;
      }
      const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const s = (timeLeft % 60).toString().padStart(2, '0');
      if (timerEl) timerEl.textContent = `${m}:${s}`;
    }, 1000);
  },

  getFoodSelectionList() {
    const items = DB.getFoodItems();
    const list = [];
    Object.keys(this.foodCart).forEach(id => {
      const item = items.find(f => f.id === parseInt(id));
      if (item && this.foodCart[id] > 0) {
        list.push({ ...item, quantity: this.foodCart[id] });
      }
    });
    return list;
  },

  calculateSubtotal() {
    const showtime = DB.getShowtimeById(this.selectedShowtimeId);
    if (!showtime) return 0;
    const seats = Seats.getSelectedSeats();
    const ticketTotal = seats.reduce((sum, s) => sum + (showtime.base_price * (s.price_multiplier || 1.0)), 0);
    const foodList = this.getFoodSelectionList();
    const foodTotal = foodList.reduce((sum, f) => sum + (f.price * f.quantity), 0);
    return ticketTotal + foodTotal;
  },

  calculateFinalTotals() {
    const showtime = DB.getShowtimeById(this.selectedShowtimeId);
    if (!showtime) return { ticketAmount: 0, foodAmount: 0, discountAmount: 0, finalTotal: 0 };

    const seats = Seats.getSelectedSeats();
    const ticketAmount = seats.reduce((sum, s) => sum + (showtime.base_price * (s.price_multiplier || 1.0)), 0);

    const foodList = this.getFoodSelectionList();
    const foodAmount = foodList.reduce((sum, f) => sum + (f.price * f.quantity), 0);

    const subtotal = ticketAmount + foodAmount;
    let discountAmount = 0;

    if (this.appliedPromo) {
      if (this.appliedPromo.discount_type === 'percentage') {
        discountAmount = (subtotal * this.appliedPromo.discount_value) / 100;
      } else {
        discountAmount = this.appliedPromo.discount_value;
      }
      if (discountAmount > subtotal) discountAmount = subtotal;
    }

    const finalTotal = subtotal - discountAmount;
    return { ticketAmount, foodAmount, discountAmount, finalTotal };
  },

  updateSummaryCard() {
    const movie = this.selectedMovieId ? DB.getMovieById(this.selectedMovieId) : null;
    const showtime = this.selectedShowtimeId ? DB.getShowtimeById(this.selectedShowtimeId) : null;
    const selectedSeats = Seats.getSelectedSeats();
    const totals = this.calculateFinalTotals();

    const movieEl = document.getElementById('sum-movie');
    const cinemaEl = document.getElementById('sum-cinema');
    const timeEl = document.getElementById('sum-time');
    const seatsEl = document.getElementById('sum-seats');
    const ticketPriceEl = document.getElementById('sum-ticket-price');
    const foodRowEl = document.getElementById('sum-food-row');
    const foodPriceEl = document.getElementById('sum-food-price');
    const discountRowEl = document.getElementById('sum-discount-row');
    const discountPriceEl = document.getElementById('sum-discount-price');
    const totalEl = document.getElementById('sum-total');

    if (movieEl) movieEl.textContent = movie ? movie.title : 'Chưa chọn';
    if (cinemaEl) cinemaEl.textContent = showtime ? showtime.cinema_name : 'Chưa chọn';
    if (timeEl) timeEl.textContent = showtime ? `${showtime.start_time} (${Utils.formatDate(showtime.show_date)})` : 'Chưa chọn';
    if (seatsEl) {
      seatsEl.textContent = selectedSeats.length 
        ? `${selectedSeats.map(s => s.seat_code).join(', ')} (${selectedSeats.length} ghế)` 
        : 'Chưa chọn';
    }
    if (ticketPriceEl) ticketPriceEl.textContent = Utils.formatCurrency(totals.ticketAmount);

    if (foodRowEl && foodPriceEl) {
      if (totals.foodAmount > 0) {
        foodRowEl.style.display = 'flex';
        foodPriceEl.textContent = Utils.formatCurrency(totals.foodAmount);
      } else {
        foodRowEl.style.display = 'none';
      }
    }

    if (discountRowEl && discountPriceEl) {
      if (totals.discountAmount > 0) {
        discountRowEl.style.display = 'flex';
        discountPriceEl.textContent = `-${Utils.formatCurrency(totals.discountAmount)}`;
      } else {
        discountRowEl.style.display = 'none';
      }
    }

    if (totalEl) totalEl.textContent = Utils.formatCurrency(totals.finalTotal);

    // Update Live Action Bar inside Step 2
    const actionSummary = document.getElementById('seat-action-summary');
    const actionTotal = document.getElementById('seat-action-total');
    const actionBtn = document.getElementById('btn-proceed-to-fb');

    if (actionSummary) {
      actionSummary.textContent = selectedSeats.length 
        ? `${selectedSeats.map(s => s.seat_code).join(', ')} (${selectedSeats.length} ghế)` 
        : 'Chưa chọn ghế nào';
    }
    if (actionTotal) {
      actionTotal.textContent = Utils.formatCurrency(Seats.getTotalPrice());
    }
    if (actionBtn) {
      if (selectedSeats.length > 0) {
        actionBtn.removeAttribute('disabled');
        actionBtn.className = 'btn btn-primary btn-lg';
      } else {
        actionBtn.setAttribute('disabled', 'true');
        actionBtn.className = 'btn btn-secondary btn-lg';
      }
    }
  },

  confirmBooking() {
    try {
      if (this.selectedPaymentMethod === 'card') {
        const cardNum = document.getElementById('card-num-input')?.value?.trim();
        const cardHolder = document.getElementById('card-holder-input')?.value?.trim();
        if (!cardNum || !cardHolder) {
          Utils.showToast('Vui lòng điền đầy đủ thông tin thẻ ngân hàng!', 'error');
          return;
        }
      }

      const fullnameInput = document.getElementById('cust-fullname')?.value?.trim();
      const phoneInput = document.getElementById('cust-phone')?.value?.trim();
      const emailInput = document.getElementById('cust-email')?.value?.trim();

      const customerData = {
        fullName: fullnameInput || this.customerName || (this.loggedInCustomer ? this.loggedInCustomer.full_name : 'Nguyễn Văn An'),
        phone: phoneInput || this.customerPhone || (this.loggedInCustomer ? this.loggedInCustomer.phone : '0901234567'),
        email: emailInput || this.customerEmail || (this.loggedInCustomer ? this.loggedInCustomer.email : 'an.nguyen@gmail.com')
      };

      const selectedSeats = Seats.getSelectedSeats();
      if (!selectedSeats || selectedSeats.length === 0) {
        Utils.showToast('Vui lòng chọn ghế trước khi thanh toán!', 'error');
        return;
      }

      if (!this.selectedShowtimeId) {
        Utils.showToast('Vui lòng chọn suất chiếu!', 'error');
        return;
      }

      const foodSelection = this.getFoodSelectionList();
      const result = DB.createBooking(
        customerData,
        this.selectedShowtimeId,
        selectedSeats,
        foodSelection,
        this.appliedPromo,
        this.selectedPaymentMethod || 'momo'
      );

      // Toast feedback
      Utils.showToast(`🎉 Đặt vé thành công! Đang chuyển đến trang Cuống Vé Điện Tử & PDF...`, 'success');
      
      // Directly redirect to success.html with booking_code and auto_pdf parameters
      setTimeout(() => {
        window.location.href = `success.html?booking_code=${result.bookingCode}&auto_pdf=true`;
      }, 400);
    } catch (e) {
      console.error("Payment Confirmation Error:", e);
      Utils.showToast(`Lỗi xử lý thanh toán: ${e.message || 'Vui lòng kiểm tra lại thông tin!'}`, 'error');
    }
  }
};
