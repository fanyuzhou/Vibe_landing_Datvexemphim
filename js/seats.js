/**
 * Interactive Seat Map & Selection Module — Ngọc Châu Cinema
 */

const Seats = {
  selectedSeats: [], // Array of seat objects { id, seat_code, price_multiplier, seat_type }
  basePrice: 100000,
  onSelectionChangeCallback: null,

  init(containerId, seatsData, basePrice, onSelectionChange) {
    this.selectedSeats = [];
    this.basePrice = basePrice || 100000;
    this.onSelectionChangeCallback = onSelectionChange;

    const container = document.getElementById(containerId);
    if (!container) return;

    this.renderSeatMap(container, seatsData);
  },

  renderSeatMap(container, seatsData) {
    // Group seats by row_name (A, B, C, D, E, F)
    const rows = {};
    seatsData.forEach(seat => {
      if (!rows[seat.row_name]) rows[seat.row_name] = [];
      rows[seat.row_name].push(seat);
    });

    let html = `
      <div class="screen-area">
        <div class="screen-bar"></div>
        <div class="screen-text">MÀN HÌNH CHIẾU</div>
      </div>

      <div class="seat-legend">
        <div class="legend-item">
          <span class="seat-icon available"></span>
          <span>Ghế Thường (${Utils.formatCurrency(this.basePrice)})</span>
        </div>
        <div class="legend-item">
          <span class="seat-icon vip"></span>
          <span>Ghế VIP (${Utils.formatCurrency(this.basePrice * 1.3)})</span>
        </div>
        <div class="legend-item">
          <span class="seat-icon selected"></span>
          <span>Đang chọn</span>
        </div>
        <div class="legend-item">
          <span class="seat-icon occupied"></span>
          <span>Đã bán</span>
        </div>
      </div>

      <div class="seats-grid">
    `;

    Object.keys(rows).sort().forEach(rowName => {
      html += `<div class="seat-row"><span class="row-label">${rowName}</span>`;
      rows[rowName].sort((a, b) => a.seat_number - b.seat_number).forEach(seat => {
        let classes = ['seat-btn'];
        if (seat.seat_type === 'vip') classes.push('vip');
        if (seat.isOccupied) classes.push('occupied');

        html += `
          <button 
            type="button" 
            class="${classes.join(' ')}" 
            data-id="${seat.id}"
            data-code="${seat.seat_code}"
            data-multiplier="${seat.price_multiplier}"
            data-type="${seat.seat_type}"
            ${seat.isOccupied ? 'disabled' : ''}
            title="${seat.seat_code} (${seat.seat_type.toUpperCase()})"
            onclick="Seats.toggleSeat(this)">
            ${seat.seat_number}
          </button>
        `;
      });
      html += `<span class="row-label">${rowName}</span></div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  toggleSeat(buttonEl) {
    if (buttonEl.classList.contains('occupied')) return;

    const seatId = parseInt(buttonEl.dataset.id);
    const seatCode = buttonEl.dataset.code;
    const priceMultiplier = parseFloat(buttonEl.dataset.multiplier || 1.0);
    const seatType = buttonEl.dataset.type;

    const existingIdx = this.selectedSeats.findIndex(s => s.id === seatId);

    if (existingIdx > -1) {
      // Unselect
      this.selectedSeats.splice(existingIdx, 1);
      buttonEl.classList.remove('selected');
    } else {
      // Select (Max 8 seats per order limit)
      if (this.selectedSeats.length >= 8) {
        Utils.showToast('Bạn chỉ được chọn tối đa 8 ghế trong một lần đặt!', 'error');
        return;
      }
      this.selectedSeats.push({
        id: seatId,
        seat_code: seatCode,
        price_multiplier: priceMultiplier,
        seat_type: seatType,
        calculatedPrice: this.basePrice * priceMultiplier
      });
      buttonEl.classList.add('selected');
    }

    if (this.onSelectionChangeCallback) {
      this.onSelectionChangeCallback(this.selectedSeats, this.getTotalPrice());
    }
  },

  getTotalPrice() {
    return this.selectedSeats.reduce((sum, seat) => sum + (this.basePrice * seat.price_multiplier), 0);
  },

  getSelectedSeats() {
    return this.selectedSeats;
  }
};
