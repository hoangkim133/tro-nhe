/**
 * Home View - List of houses
 */
const HomeView = (() => {
    function render() {
        const houses = Store.getHouses();
        const container = document.getElementById('main-content');

        App.setHeader('Nhà Trọ', false);
        Navbar.show();
        Navbar.setActive('home');

        if (houses.length === 0) {
            container.innerHTML = `
                <div class="empty-state fade-in">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <p>Chưa có nhà trọ nào.<br>Bấm nút bên dưới để thêm nhà trọ mới!</p>
                    <button class="btn btn-primary" onclick="HomeView.showAddForm()">
                        ➕ Thêm nhà trọ
                    </button>
                </div>
            `;
            return;
        }

        let html = '<div class="fade-in">';
        for (const house of houses) {
            const rooms = (house.rooms || []).filter(r => !r.deleted);
            const roomCount = rooms.length;

            // Count unpaid invoices this month
            const currentMonth = Store.getCurrentMonth();
            let unpaidCount = 0;
            for (const room of rooms) {
                const meter = (room.meters || []).find(m => m.month === currentMonth);
                if (meter && !meter.paid) unpaidCount++;
            }

            html += `
                <div class="card" onclick="App.navigate('house', '${house.id}')">
                    <div class="card-title">🏠 ${house.name}</div>
                    <div class="card-subtitle">${house.address || 'Chưa có địa chỉ'}</div>
                    <div class="card-meta">
                        <span class="card-badge">🚪 ${roomCount} phòng</span>
                        ${unpaidCount > 0 ? `<span class="card-badge warning">⏳ ${unpaidCount} chưa thu</span>` : ''}
                    </div>
                </div>
            `;
        }
        html += '</div>';

        html += `
            <button class="fab" onclick="HomeView.showAddForm()" aria-label="Thêm nhà trọ">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
        `;

        container.innerHTML = html;
    }

    function showAddForm() {
        App.showModal('Thêm nhà trọ mới', `
            <div class="form-group">
                <label class="form-label">Tên nhà trọ *</label>
                <input class="form-input" id="input-house-name" placeholder="VD: Nhà trọ Hùng" autocomplete="off">
            </div>
            <div class="form-group">
                <label class="form-label">Địa chỉ</label>
                <input class="form-input" id="input-house-address" placeholder="VD: 123 Lý Thường Kiệt">
            </div>
            <div class="section-title">Giá mặc định</div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">⚡ Điện (đ/kWh)</label>
                    <input class="form-input" type="number" id="input-electric" value="3500" inputmode="numeric">
                </div>
                <div class="form-group">
                    <label class="form-label">💧 Nước (đ/m³)</label>
                    <input class="form-input" type="number" id="input-water" value="15000" inputmode="numeric">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">🗑️ Rác (đ/tháng)</label>
                    <input class="form-input" type="number" id="input-garbage" value="20000" inputmode="numeric">
                </div>
                <div class="form-group">
                    <label class="form-label">📶 Internet (đ/tháng)</label>
                    <input class="form-input" type="number" id="input-internet" value="100000" inputmode="numeric">
                </div>
            </div>
            <button class="btn btn-primary mt-16" onclick="HomeView.addHouse()">✅ Thêm nhà trọ</button>
        `);

        setTimeout(() => document.getElementById('input-house-name').focus(), 300);
    }

    function addHouse() {
        const name = document.getElementById('input-house-name').value.trim();
        if (!name) {
            App.showToast('Vui lòng nhập tên nhà trọ', 'error');
            return;
        }

        Store.addHouse({
            name: name,
            address: document.getElementById('input-house-address').value.trim(),
            electricRate: parseInt(document.getElementById('input-electric').value) || 3500,
            waterRate: parseInt(document.getElementById('input-water').value) || 15000,
            garbageRate: parseInt(document.getElementById('input-garbage').value) || 20000,
            internetRate: parseInt(document.getElementById('input-internet').value) || 100000
        });

        App.hideModal();
        App.showToast('Đã thêm nhà trọ!', 'success');
        render();
    }

    return { render, showAddForm, addHouse };
})();
