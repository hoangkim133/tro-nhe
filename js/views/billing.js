/**
 * Billing View - Enter meter readings + view invoice
 */
const BillingView = (() => {
    let currentHouseId = null;
    let currentRoomId = null;
    let currentMonth = null;

    function render(houseId, roomId, month) {
        currentHouseId = houseId;
        currentRoomId = roomId;
        currentMonth = month || Store.getCurrentMonth();

        const house = Store.getHouse(houseId);
        const room = Store.getRoom(houseId, roomId);
        if (!house || !room) {
            App.navigate('home');
            return;
        }

        const container = document.getElementById('main-content');
        const meter = Store.getMeterByMonth(houseId, roomId, currentMonth);

        App.setHeader(Store.formatMonth(currentMonth), true);
        Navbar.show();

        if (meter) {
            // Show invoice
            renderInvoice(house, room, meter);
        } else {
            // Show meter input form
            renderForm(house, room);
        }
    }

    function renderInvoice(house, room, meter) {
        const container = document.getElementById('main-content');

        let html = '<div class="fade-in">';
        html += Invoice.render(meter, room.name, house.name, room.tenant);

        // Action buttons
        html += `
            <div class="btn-group mt-16">
                <button class="btn btn-primary btn-sm" onclick="BillingView.share()">
                    📤 Gửi Zalo
                </button>
                <button class="btn btn-outline btn-sm" onclick="Invoice.printInvoice()">
                    🖨️ In
                </button>
            </div>
        `;

        // Toggle paid
        html += `
            <button class="btn ${meter.paid ? 'btn-outline' : 'btn-secondary'} mt-8" onclick="BillingView.togglePaid('${meter.id}')">
                ${meter.paid ? '↩️ Đánh dấu chưa thu' : '✅ Đánh dấu đã thu tiền'}
            </button>
        `;

        // Edit meter
        html += `
            <button class="btn btn-outline btn-sm mt-8" onclick="BillingView.editMeter()">
                ✏️ Sửa chỉ số
            </button>
        `;

        html += '</div>';
        container.innerHTML = html;
    }

    function renderForm(house, room) {
        const container = document.getElementById('main-content');
        const rates = Store.getRatesForRoom(currentHouseId, currentRoomId);

        // Get last meter reading for auto-fill
        const lastMeter = Store.getLatestMeter(currentHouseId, currentRoomId);
        const electricOld = lastMeter ? lastMeter.electricNew : 0;
        const waterOld = lastMeter ? lastMeter.waterNew : 0;

        let html = `
            <div class="fade-in">
                <div class="card" style="cursor:default;">
                    <div class="card-title">🚪 ${room.name}</div>
                    <div class="card-subtitle">👤 ${room.tenant || 'Phòng trống'}</div>
                </div>

                <div class="section-title">Chỉ số điện ⚡</div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Số cũ</label>
                        <input class="form-input" type="number" id="input-electric-old" value="${electricOld}" inputmode="numeric">
                        <div class="form-hint">${lastMeter ? 'Từ tháng trước' : 'Nhập số ban đầu'}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Số mới *</label>
                        <input class="form-input" type="number" id="input-electric-new" placeholder="Nhập số mới" inputmode="numeric" autofocus>
                    </div>
                </div>

                <div class="section-title">Chỉ số nước 💧</div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Số cũ</label>
                        <input class="form-input" type="number" id="input-water-old" value="${waterOld}" inputmode="numeric">
                        <div class="form-hint">${lastMeter ? 'Từ tháng trước' : 'Nhập số ban đầu'}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Số mới *</label>
                        <input class="form-input" type="number" id="input-water-new" placeholder="Nhập số mới" inputmode="numeric">
                    </div>
                </div>

                <div class="divider"></div>
                <div style="background:var(--success-light); padding:14px; border-radius:var(--radius-sm); margin-bottom:16px;">
                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:4px;">Giá áp dụng:</div>
                    <div style="font-size:0.85rem;">
                        ⚡ ${Store.formatCurrency(rates.electric)}/kWh &nbsp;&nbsp;
                        💧 ${Store.formatCurrency(rates.water)}/m³<br>
                        🏠 Phòng: ${Store.formatCurrency(rates.rent)} &nbsp;&nbsp;
                        🗑️ ${Store.formatCurrency(rates.garbage)} &nbsp;&nbsp;
                        📶 ${Store.formatCurrency(rates.internet)}
                    </div>
                </div>

                <button class="btn btn-primary" onclick="BillingView.saveMeter()">
                    📄 Tạo hóa đơn
                </button>
            </div>
        `;

        container.innerHTML = html;
    }

    function saveMeter() {
        const electricOld = parseInt(document.getElementById('input-electric-old').value) || 0;
        const electricNew = parseInt(document.getElementById('input-electric-new').value);
        const waterOld = parseInt(document.getElementById('input-water-old').value) || 0;
        const waterNew = parseInt(document.getElementById('input-water-new').value);

        if (isNaN(electricNew)) {
            App.showToast('Vui lòng nhập số điện mới', 'error');
            return;
        }
        if (isNaN(waterNew)) {
            App.showToast('Vui lòng nhập số nước mới', 'error');
            return;
        }
        if (electricNew < electricOld) {
            App.showToast('Số điện mới phải lớn hơn số cũ', 'error');
            return;
        }
        if (waterNew < waterOld) {
            App.showToast('Số nước mới phải lớn hơn số cũ', 'error');
            return;
        }

        Store.addMeter(currentHouseId, currentRoomId, {
            month: currentMonth,
            electricOld,
            electricNew,
            waterOld,
            waterNew
        });

        App.showToast('Đã tạo hóa đơn!', 'success');
        render(currentHouseId, currentRoomId, currentMonth);
    }

    function editMeter() {
        const meter = Store.getMeterByMonth(currentHouseId, currentRoomId, currentMonth);
        if (!meter) return;

        const room = Store.getRoom(currentHouseId, currentRoomId);

        App.showModal('Sửa chỉ số — ' + Store.formatMonth(currentMonth), `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">⚡ Điện cũ</label>
                    <input class="form-input" type="number" id="edit-e-old" value="${meter.electricOld}" inputmode="numeric">
                </div>
                <div class="form-group">
                    <label class="form-label">⚡ Điện mới</label>
                    <input class="form-input" type="number" id="edit-e-new" value="${meter.electricNew}" inputmode="numeric">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">💧 Nước cũ</label>
                    <input class="form-input" type="number" id="edit-w-old" value="${meter.waterOld}" inputmode="numeric">
                </div>
                <div class="form-group">
                    <label class="form-label">💧 Nước mới</label>
                    <input class="form-input" type="number" id="edit-w-new" value="${meter.waterNew}" inputmode="numeric">
                </div>
            </div>
            <button class="btn btn-primary mt-16" onclick="BillingView.saveEditMeter()">💾 Lưu</button>
        `);
    }

    function saveEditMeter() {
        const electricOld = parseInt(document.getElementById('edit-e-old').value) || 0;
        const electricNew = parseInt(document.getElementById('edit-e-new').value) || 0;
        const waterOld = parseInt(document.getElementById('edit-w-old').value) || 0;
        const waterNew = parseInt(document.getElementById('edit-w-new').value) || 0;

        Store.addMeter(currentHouseId, currentRoomId, {
            month: currentMonth,
            electricOld,
            electricNew,
            waterOld,
            waterNew
        });

        App.hideModal();
        App.showToast('Đã cập nhật!', 'success');
        render(currentHouseId, currentRoomId, currentMonth);
    }

    function togglePaid(meterId) {
        Store.togglePaid(currentHouseId, currentRoomId, meterId);
        render(currentHouseId, currentRoomId, currentMonth);
    }

    function share() {
        const house = Store.getHouse(currentHouseId);
        const room = Store.getRoom(currentHouseId, currentRoomId);
        const meter = Store.getMeterByMonth(currentHouseId, currentRoomId, currentMonth);
        if (meter) {
            Invoice.shareInvoice(meter, room.name, house.name, room.tenant);
        }
    }

    return { render, saveMeter, editMeter, saveEditMeter, togglePaid, share };
})();
