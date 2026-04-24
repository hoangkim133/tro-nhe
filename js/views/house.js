/**
 * House View - Rooms list for a specific house
 */
const HouseView = (() => {
    let currentHouseId = null;

    function render(houseId) {
        currentHouseId = houseId;
        const house = Store.getHouse(houseId);
        if (!house) {
            App.navigate('home');
            return;
        }

        const rooms = Store.getRooms(houseId);
        const container = document.getElementById('main-content');
        const currentMonth = Store.getCurrentMonth();

        App.setHeader(house.name, true);
        Navbar.show();
        Navbar.setActive('home');

        let html = '<div class="fade-in">';

        if (rooms.length === 0) {
            html += `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    <p>Chưa có phòng nào.<br>Bấm nút bên dưới để thêm phòng!</p>
                    <button class="btn btn-primary" onclick="HouseView.showAddRoom()">
                        ➕ Thêm phòng
                    </button>
                </div>
            `;
        } else {
            for (const room of rooms) {
                const meter = (room.meters || []).find(m => m.month === currentMonth);
                const hasMeter = !!meter;
                const isPaid = meter ? meter.paid : false;

                let statusHtml = '';
                if (!hasMeter) {
                    statusHtml = '<span class="card-badge warning">📝 Chưa nhập</span>';
                } else if (!isPaid) {
                    statusHtml = `<span class="card-badge danger">⏳ ${Store.formatCurrency(meter.totalAmount)}</span>`;
                } else {
                    statusHtml = '<span class="card-badge">✅ Đã thu</span>';
                }

                html += `
                    <div class="card" onclick="App.navigate('room', '${houseId}', '${room.id}')">
                        <div class="card-title">🚪 ${room.name}</div>
                        <div class="card-subtitle">👤 ${room.tenant || 'Phòng trống'}</div>
                        <div class="card-meta">
                            ${statusHtml}
                        </div>
                    </div>
                `;
            }
        }
        html += '</div>';

        // House settings button
        html += `
            <div class="mt-16">
                <button class="btn btn-outline btn-sm" onclick="HouseView.showHouseSettings()">
                    ⚙️ Cài đặt giá chung
                </button>
            </div>
        `;

        // FAB
        html += `
            <button class="fab" onclick="HouseView.showAddRoom()" aria-label="Thêm phòng">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
        `;

        container.innerHTML = html;
    }

    function showAddRoom() {
        const house = Store.getHouse(currentHouseId);
        const defaultRent = (house && house.defaultRates) ? house.defaultRates.rent || 0 : 0;

        App.showModal('Thêm phòng mới', `
            <div class="form-group">
                <label class="form-label">Tên phòng *</label>
                <input class="form-input" id="input-room-name" placeholder="VD: Phòng 1" autocomplete="off">
            </div>
            <div class="form-group">
                <label class="form-label">Tên người thuê</label>
                <input class="form-input" id="input-room-tenant" placeholder="VD: Nguyễn Văn A">
            </div>
            <div class="form-group">
                <label class="form-label">Số điện thoại</label>
                <input class="form-input" type="tel" id="input-room-phone" placeholder="VD: 0901234567" inputmode="tel">
            </div>
            <div class="form-group">
                <label class="form-label">Tiền phòng (đ/tháng)</label>
                <input class="form-input" type="number" id="input-room-rent" value="${defaultRent || ''}" placeholder="Để trống = dùng giá chung" inputmode="numeric">
            </div>
            <div class="divider"></div>
            <p class="text-secondary mb-16" style="font-size:0.85rem;">📝 Chỉ số điện nước hiện tại (ban đầu)</p>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">⚡ Số điện hiện tại *</label>
                    <input class="form-input" type="number" id="input-room-electric" placeholder="VD: 1234" inputmode="numeric">
                </div>
                <div class="form-group">
                    <label class="form-label">💧 Số nước hiện tại *</label>
                    <input class="form-input" type="number" id="input-room-water" placeholder="VD: 56" inputmode="numeric">
                </div>
            </div>
            <button class="btn btn-primary mt-16" onclick="HouseView.addRoom()">✅ Thêm phòng</button>
        `);

        setTimeout(() => document.getElementById('input-room-name').focus(), 300);
    }

    function addRoom() {
        const name = document.getElementById('input-room-name').value.trim();
        if (!name) {
            App.showToast('Vui lòng nhập tên phòng', 'error');
            return;
        }

        const electricInit = document.getElementById('input-room-electric').value;
        const waterInit = document.getElementById('input-room-water').value;
        if (electricInit === '' || waterInit === '') {
            App.showToast('Vui lòng nhập số điện nước ban đầu', 'error');
            return;
        }

        Store.addRoom(currentHouseId, {
            name: name,
            tenant: document.getElementById('input-room-tenant').value.trim(),
            phone: document.getElementById('input-room-phone').value.trim(),
            rentPrice: parseInt(document.getElementById('input-room-rent').value) || 0,
            initialElectric: parseInt(electricInit) || 0,
            initialWater: parseInt(waterInit) || 0
        });

        App.hideModal();
        App.showToast('Đã thêm phòng!', 'success');
        render(currentHouseId);
    }

    function showHouseSettings() {
        const house = Store.getHouse(currentHouseId);
        if (!house) return;

        const rates = house.defaultRates || {};

        App.showModal('Cài đặt giá chung — ' + house.name, `
            <p class="text-secondary mb-16" style="font-size:0.85rem;">Giá này sẽ áp dụng cho tất cả phòng (trừ phòng có giá riêng).</p>
            <div class="form-group">
                <label class="form-label">🏠 Tiền phòng chung (đ/tháng)</label>
                <input class="form-input" type="number" id="input-def-rent" value="${rates.rent || 0}" inputmode="numeric">
                <div class="form-hint">Phòng có giá riêng sẽ không bị ảnh hưởng</div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">⚡ Điện (đ/kWh)</label>
                    <input class="form-input" type="number" id="input-def-electric" value="${rates.electric || 3500}" inputmode="numeric">
                </div>
                <div class="form-group">
                    <label class="form-label">💧 Nước (đ/m³)</label>
                    <input class="form-input" type="number" id="input-def-water" value="${rates.water || 15000}" inputmode="numeric">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">🗑️ Rác (đ/tháng)</label>
                    <input class="form-input" type="number" id="input-def-garbage" value="${rates.garbage || 20000}" inputmode="numeric">
                </div>
                <div class="form-group">
                    <label class="form-label">📶 Internet (đ/tháng)</label>
                    <input class="form-input" type="number" id="input-def-internet" value="${rates.internet || 100000}" inputmode="numeric">
                </div>
            </div>
            <div class="btn-group">
                <button class="btn btn-primary" onclick="HouseView.saveHouseSettings()">💾 Lưu</button>
            </div>
            <div class="divider"></div>
            <button class="btn btn-danger btn-sm" onclick="HouseView.confirmDeleteHouse()">🗑️ Xóa nhà trọ này</button>
        `);
    }

    function saveHouseSettings() {
        Store.updateHouse(currentHouseId, {
            defaultRates: {
                rent: parseInt(document.getElementById('input-def-rent').value) || 0,
                electric: parseInt(document.getElementById('input-def-electric').value) || 3500,
                water: parseInt(document.getElementById('input-def-water').value) || 15000,
                garbage: parseInt(document.getElementById('input-def-garbage').value) || 20000,
                internet: parseInt(document.getElementById('input-def-internet').value) || 100000
            }
        });

        App.hideModal();
        App.showToast('Đã lưu cài đặt!', 'success');
    }

    function confirmDeleteHouse() {
        const house = Store.getHouse(currentHouseId);
        App.showModal('⚠️ Xác nhận xóa', `
            <p style="font-size:1.1rem; margin-bottom:20px;">Bạn có chắc muốn xóa <strong>${house.name}</strong>?<br>Tất cả phòng và dữ liệu sẽ bị xóa.</p>
            <div class="btn-group">
                <button class="btn btn-outline" onclick="App.hideModal()">Hủy</button>
                <button class="btn btn-danger" onclick="HouseView.deleteHouse()">Xóa</button>
            </div>
        `);
    }

    function deleteHouse() {
        Store.deleteHouse(currentHouseId);
        App.hideModal();
        App.showToast('Đã xóa nhà trọ', 'success');
        App.navigate('home');
    }

    return { render, showAddRoom, addRoom, showHouseSettings, saveHouseSettings, confirmDeleteHouse, deleteHouse };
})();
