/**
 * Room View - Room details + actions
 */
const RoomView = (() => {
    let currentHouseId = null;
    let currentRoomId = null;

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
        const currentMonth = Store.getCurrentMonth();
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

        // Quick actions
        html += `
            <div class="section-title">${Store.formatMonth(currentMonth)}</div>
        `;

        if (!meter) {
            html += `
                <button class="btn btn-secondary mb-8" onclick="App.navigate('billing', '${houseId}', '${roomId}')">
                    📝 Nhập chỉ số điện nước
                </button>
            `;
        } else {
            html += `
                <button class="btn btn-primary mb-8" onclick="App.navigate('billing', '${houseId}', '${roomId}')">
                    📄 Xem hóa đơn tháng này
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
                    <div class="desc">Tên, người thuê, tiền phòng</div>
                </div>
            </div>
            <div class="settings-item" onclick="RoomView.showCustomRates()">
                <div class="icon orange">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div class="info">
                    <div class="title">Giá riêng cho phòng này</div>
                    <div class="desc">${room.customRates ? 'Đang dùng giá riêng' : 'Đang dùng giá chung của nhà'}</div>
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

        // Delete room
        html += `
            <div class="mt-24">
                <button class="btn btn-danger btn-sm" onclick="RoomView.confirmDelete()">🗑️ Xóa phòng này</button>
            </div>
        `;

        html += '</div>';
        container.innerHTML = html;
    }

    function showEditRoom() {
        const room = Store.getRoom(currentHouseId, currentRoomId);
        if (!room) return;

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
                <input class="form-input" type="number" id="edit-room-rent" value="${room.rentPrice || 0}" inputmode="numeric">
            </div>
            <button class="btn btn-primary mt-16" onclick="RoomView.saveEditRoom()">💾 Lưu</button>
        `);
    }

    function saveEditRoom() {
        Store.updateRoom(currentHouseId, currentRoomId, {
            name: document.getElementById('edit-room-name').value.trim(),
            tenant: document.getElementById('edit-room-tenant').value.trim(),
            phone: document.getElementById('edit-room-phone').value.trim(),
            rentPrice: parseInt(document.getElementById('edit-room-rent').value) || 0
        });

        App.hideModal();
        App.showToast('Đã lưu!', 'success');
        render(currentHouseId, currentRoomId);
    }

    function showCustomRates() {
        const room = Store.getRoom(currentHouseId, currentRoomId);
        const house = Store.getHouse(currentHouseId);
        if (!room || !house) return;

        const custom = room.customRates || {};
        const defaults = house.defaultRates || {};

        App.showModal('Giá riêng — ' + room.name, `
            <p class="text-secondary mb-16" style="font-size:0.85rem;">Để trống = dùng giá chung của nhà.</p>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">⚡ Điện (đ/kWh)</label>
                    <input class="form-input" type="number" id="custom-electric" value="${custom.electric || ''}" placeholder="${defaults.electric}" inputmode="numeric">
                </div>
                <div class="form-group">
                    <label class="form-label">💧 Nước (đ/m³)</label>
                    <input class="form-input" type="number" id="custom-water" value="${custom.water || ''}" placeholder="${defaults.water}" inputmode="numeric">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">🗑️ Rác (đ/tháng)</label>
                    <input class="form-input" type="number" id="custom-garbage" value="${custom.garbage || ''}" placeholder="${defaults.garbage}" inputmode="numeric">
                </div>
                <div class="form-group">
                    <label class="form-label">📶 Internet (đ/tháng)</label>
                    <input class="form-input" type="number" id="custom-internet" value="${custom.internet || ''}" placeholder="${defaults.internet}" inputmode="numeric">
                </div>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline" onclick="RoomView.clearCustomRates()">Xóa giá riêng</button>
                <button class="btn btn-primary" onclick="RoomView.saveCustomRates()">💾 Lưu</button>
            </div>
        `);
    }

    function saveCustomRates() {
        const e = document.getElementById('custom-electric').value;
        const w = document.getElementById('custom-water').value;
        const g = document.getElementById('custom-garbage').value;
        const i = document.getElementById('custom-internet').value;

        const customRates = {};
        if (e) customRates.electric = parseInt(e);
        if (w) customRates.water = parseInt(w);
        if (g) customRates.garbage = parseInt(g);
        if (i) customRates.internet = parseInt(i);

        Store.updateRoom(currentHouseId, currentRoomId, {
            customRates: Object.keys(customRates).length > 0 ? customRates : null
        });

        App.hideModal();
        App.showToast('Đã lưu giá riêng!', 'success');
        render(currentHouseId, currentRoomId);
    }

    function clearCustomRates() {
        Store.updateRoom(currentHouseId, currentRoomId, { customRates: null });
        App.hideModal();
        App.showToast('Đã xóa giá riêng, dùng giá chung', 'success');
        render(currentHouseId, currentRoomId);
    }

    function confirmDelete() {
        const room = Store.getRoom(currentHouseId, currentRoomId);
        App.showModal('⚠️ Xác nhận xóa', `
            <p style="font-size:1.1rem; margin-bottom:20px;">Bạn có chắc muốn xóa <strong>${room.name}</strong>?</p>
            <div class="btn-group">
                <button class="btn btn-outline" onclick="App.hideModal()">Hủy</button>
                <button class="btn btn-danger" onclick="RoomView.deleteRoom()">Xóa</button>
            </div>
        `);
    }

    function deleteRoom() {
        Store.deleteRoom(currentHouseId, currentRoomId);
        App.hideModal();
        App.showToast('Đã xóa phòng', 'success');
        App.navigate('house', currentHouseId);
    }

    return { render, showEditRoom, saveEditRoom, showCustomRates, saveCustomRates, clearCustomRates, confirmDelete, deleteRoom };
})();
