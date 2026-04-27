/**
 * Room View - Room details + actions
 */
const RoomView = (() => {
    let currentHouseId = null;
    let currentRoomId = null;
    let selectedMonth = null;

    function render(houseId, roomId) {
        currentHouseId = houseId;
        currentRoomId = roomId;

        const house = Store.getHouse(houseId);
        const room = Store.getRoom(houseId, roomId);
        if (!house || !room) {
            App.navigate('home');
            return;
        }

        const container = document.getElementById('main-content');
        const currentMonth = selectedMonth || Store.getCurrentMonth();
        const meter = Store.getMeterByMonth(houseId, roomId, currentMonth);
        const rates = Store.getRatesForRoom(houseId, roomId);

        App.setHeader(room.name, true);
        Navbar.show();
        Navbar.setActive('home');

        let html = '<div class="fade-in">';

        // Room info card
        html += `
            <div class="card" style="cursor:default;">
                <div class="card-title">👤 ${room.tenant || 'Phòng trống'}</div>
                <div class="card-subtitle">📞 ${room.phone || 'Chưa có SĐT'}</div>
                <div class="card-meta">
                    <span class="card-badge">💰 ${Store.formatCurrency(room.rentPrice || 0)}/tháng</span>
                </div>
            </div>
        `;

        // Month selector + quick actions
        const months = getMonthOptions();
        html += `
            <div class="section-title">Tạo / xem hóa đơn</div>
            <div style="display:flex; gap:10px; align-items:center; margin-bottom:12px;">
                <select id="select-month" class="form-input" style="min-height:48px; flex:1;" onchange="RoomView.onMonthChange()">
                    ${months.map(m => `<option value="${m.value}" ${m.value === currentMonth ? 'selected' : ''}>${m.label}</option>`).join('')}
                </select>
            </div>
        `;

        if (!meter) {
            html += `
                <button class="btn btn-secondary mb-8" onclick="RoomView.goToBilling()">
                    📝 Nhập chỉ số điện nước
                </button>
            `;
        } else {
            html += `
                <button class="btn btn-primary mb-8" onclick="RoomView.goToBilling()">
                    📄 Xem hóa đơn ${Store.formatMonth(currentMonth)}
                </button>
            `;
        }

        // Settings section
        html += `
            <div class="section-title">Cài đặt phòng</div>
            <div class="settings-item" onclick="RoomView.showEditRoom()">
                <div class="icon green">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div class="info">
                    <div class="title">Sửa thông tin phòng</div>
                    <div class="desc">Tên, người thuê, tiền phòng, giá riêng</div>
                </div>
            </div>
        `;

        // History section
        const meters = Store.getMeters(houseId, roomId);
        if (meters.length > 0) {
            html += `<div class="section-title">Lịch sử hóa đơn</div>`;
            for (const m of meters.slice(0, 6)) {
                html += `
                    <div class="card" onclick="App.navigate('billing', '${houseId}', '${roomId}', '${m.month}')" style="padding:14px 20px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:600;">${Store.formatMonth(m.month)}</div>
                                <div style="font-size:0.8rem; color:var(--text-secondary);">
                                    ⚡${m.electricNew - m.electricOld}kWh &nbsp; 💧${m.waterNew - m.waterOld}m³
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-weight:700; font-size:1.05rem;">${Store.formatCurrency(m.totalAmount)}</div>
                                <span class="status-badge ${m.paid ? 'paid' : 'unpaid'}" style="font-size:0.7rem; padding:2px 8px;">
                                    ${m.paid ? '✅ Đã thu' : '⏳ Chưa thu'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        html += '<div style="padding-bottom:80px;"></div>';
        html += '</div>';
        container.innerHTML = html;
    }

    function showEditRoom() {
        const room = Store.getRoom(currentHouseId, currentRoomId);
        const house = Store.getHouse(currentHouseId);
        if (!room || !house) return;

        const custom = room.customRates || {};
        const defaults = house.defaultRates || {};

        App.showModal('Sửa thông tin phòng', `
            <div class="form-group">
                <label class="form-label">Tên phòng *</label>
                <input class="form-input" id="edit-room-name" value="${room.name}">
            </div>
            <div class="form-group">
                <label class="form-label">Tên người thuê</label>
                <input class="form-input" id="edit-room-tenant" value="${room.tenant || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Số điện thoại</label>
                <input class="form-input" type="tel" id="edit-room-phone" value="${room.phone || ''}" inputmode="tel">
            </div>
            <div class="form-group">
                <label class="form-label">Tiền phòng (đ/tháng)</label>
                ${Store.moneyInput('edit-room-rent', room.rentPrice || 0)}
            </div>

            <div class="divider"></div>
            <p class="text-secondary mb-16" style="font-size:0.85rem;">💰 Giá riêng cho phòng này (để trống = dùng giá chung của nhà)</p>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">⚡ Điện (đ/kWh)</label>
                    ${Store.moneyInput('custom-electric', custom.electric || '', Store.formatNumber(defaults.electric || 3500))}
                </div>
                <div class="form-group">
                    <label class="form-label">💧 Nước (đ/m³)</label>
                    ${Store.moneyInput('custom-water', custom.water || '', Store.formatNumber(defaults.water || 15000))}
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">🗑️ Rác (đ/tháng)</label>
                    ${Store.moneyInput('custom-garbage', custom.garbage || '', Store.formatNumber(defaults.garbage || 20000))}
                </div>
                <div class="form-group">
                    <label class="form-label">📶 Internet (đ/tháng)</label>
                    ${Store.moneyInput('custom-internet', custom.internet || '', Store.formatNumber(defaults.internet || 100000))}
                </div>
            </div>

            <button class="btn btn-primary mt-16" onclick="RoomView.saveEditRoom()">💾 Lưu</button>
        `);
    }

    function saveEditRoom() {
        const e = document.getElementById('custom-electric').value;
        const w = document.getElementById('custom-water').value;
        const g = document.getElementById('custom-garbage').value;
        const i = document.getElementById('custom-internet').value;

        const customRates = {};
        if (e && e !== '0') customRates.electric = Store.parseMoney(e);
        if (w && w !== '0') customRates.water = Store.parseMoney(w);
        if (g && g !== '0') customRates.garbage = Store.parseMoney(g);
        if (i && i !== '0') customRates.internet = Store.parseMoney(i);

        Store.updateRoom(currentHouseId, currentRoomId, {
            name: document.getElementById('edit-room-name').value.trim(),
            tenant: document.getElementById('edit-room-tenant').value.trim(),
            phone: document.getElementById('edit-room-phone').value.trim(),
            rentPrice: Store.parseMoney(document.getElementById('edit-room-rent').value),
            customRates: Object.keys(customRates).length > 0 ? customRates : null
        });

        App.hideModal();
        App.showToast('Đã lưu!', 'success');
        render(currentHouseId, currentRoomId);
    }

    function getMonthOptions() {
        const now = new Date();
        const options = [];
        for (let i = -6; i <= 5; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            const label = Store.formatMonth(value) + (i === 0 ? ' (tháng này)' : '');
            options.push({ value, label });
        }
        return options;
    }

    function goToBilling() {
        const select = document.getElementById('select-month');
        const month = select ? select.value : Store.getCurrentMonth();
        App.navigate('billing', currentHouseId, currentRoomId, month);
    }

    function onMonthChange() {
        const select = document.getElementById('select-month');
        selectedMonth = select.value;
        render(currentHouseId, currentRoomId);
    }

    return { render, showEditRoom, saveEditRoom, goToBilling, onMonthChange };
})();
