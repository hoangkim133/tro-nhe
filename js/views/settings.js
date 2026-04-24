/**
 * Settings View - App settings, sync, about
 */
const SettingsView = (() => {
    function render() {
        const container = document.getElementById('main-content');
        const settings = Store.getSettings();

        App.setHeader('Cài đặt', false);
        Navbar.show();
        Navbar.setActive('settings');

        const hasSync = !!(settings.scriptUrl && settings.appSecret);

        let html = `
            <div class="fade-in">
                <div class="section-title">Đồng bộ Google Sheets</div>

                <div class="settings-item" onclick="SettingsView.showSyncSetup()">
                    <div class="icon green">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/></svg>
                    </div>
                    <div class="info">
                        <div class="title">Kết nối Google Sheets</div>
                        <div class="desc">${hasSync ? '✅ Đã kết nối' : '⚠️ Chưa cài đặt'}</div>
                    </div>
                </div>

                ${hasSync ? `
                <div class="settings-item" onclick="SettingsView.syncNow()">
                    <div class="icon green">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    </div>
                    <div class="info">
                        <div class="title">Đồng bộ ngay</div>
                        <div class="desc">Gửi dữ liệu lên Google Sheets</div>
                    </div>
                </div>

                <div class="settings-item" onclick="SettingsView.confirmRestore()">
                    <div class="icon orange">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </div>
                    <div class="info">
                        <div class="title">Khôi phục từ Google Sheets</div>
                        <div class="desc">Tải dữ liệu từ Google Sheets về</div>
                    </div>
                </div>
                ` : ''}

                <div class="section-title">Bảo mật</div>

                <div class="settings-item" onclick="App.changePin()">
                    <div class="icon green">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div class="info">
                        <div class="title">Đổi mã PIN</div>
                        <div class="desc">Thay đổi mã PIN mở khóa ứng dụng</div>
                    </div>
                </div>

                <div class="section-title">Dữ liệu</div>

                <div class="settings-item" onclick="SettingsView.exportLocal()">
                    <div class="icon green">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <div class="info">
                        <div class="title">Xuất dữ liệu (JSON)</div>
                        <div class="desc">Lưu file backup về máy</div>
                    </div>
                </div>

                <div class="settings-item" onclick="SettingsView.importLocal()">
                    <div class="icon orange">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </div>
                    <div class="info">
                        <div class="title">Nhập dữ liệu (JSON)</div>
                        <div class="desc">Khôi phục từ file backup</div>
                    </div>
                </div>

                <div class="settings-item" onclick="SettingsView.confirmClearData()">
                    <div class="icon red">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </div>
                    <div class="info">
                        <div class="title">Xóa toàn bộ dữ liệu</div>
                        <div class="desc">Xóa tất cả nhà trọ, phòng, hóa đơn</div>
                    </div>
                </div>

                <div class="section-title">Thông tin</div>
                <div style="text-align:center; padding:16px; color:var(--text-light); font-size:0.85rem;">
                    <p><strong>Nhà Trọ</strong> v1.0</p>
                    <p>Ứng dụng quản lý phòng trọ</p>
                    <p>Thiết kế đơn giản, dễ dùng 💚</p>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function showSyncSetup() {
        const settings = Store.getSettings();

        App.showModal('Kết nối Google Sheets', `
            <p class="text-secondary mb-16" style="font-size:0.85rem;">
                Nhập URL Google Apps Script và mật khẩu để đồng bộ dữ liệu.
            </p>
            <div class="form-group">
                <label class="form-label">URL Apps Script</label>
                <input class="form-input" id="input-script-url" value="${settings.scriptUrl || ''}" placeholder="https://script.google.com/macros/s/...">
                <div class="form-hint">Lấy từ Apps Script → Deploy → Web App URL</div>
            </div>
            <div class="form-group">
                <label class="form-label">Mật khẩu (APP_SECRET)</label>
                <input class="form-input" id="input-app-secret" value="${settings.appSecret || ''}" placeholder="VD: nha-tro-me-2026">
            </div>
            <button class="btn btn-primary mt-16" onclick="SettingsView.saveSyncSetup()">💾 Lưu</button>
        `);
    }

    function saveSyncSetup() {
        const url = document.getElementById('input-script-url').value.trim();
        const secret = document.getElementById('input-app-secret').value.trim();

        const settings = Store.getSettings();
        settings.scriptUrl = url;
        settings.appSecret = secret;
        Store.saveSettings(settings);

        App.hideModal();
        App.showToast('Đã lưu cài đặt đồng bộ!', 'success');
        render();
    }

    async function syncNow() {
        App.showToast('Đang đồng bộ...', 'success');
        const data = Store.exportData();
        Sync.enqueue(data);
        await Sync.processQueue();
        App.showToast('Đã đồng bộ xong!', 'success');
    }

    function confirmRestore() {
        App.showModal('⚠️ Khôi phục dữ liệu', `
            <p style="font-size:1rem; margin-bottom:20px;">
                Dữ liệu hiện tại trên điện thoại sẽ bị <strong>thay thế</strong> bằng dữ liệu từ Google Sheets.<br><br>
                Bạn có chắc chắn?
            </p>
            <div class="btn-group">
                <button class="btn btn-outline" onclick="App.hideModal()">Hủy</button>
                <button class="btn btn-secondary" onclick="SettingsView.doRestore()">Khôi phục</button>
            </div>
        `);
    }

    async function doRestore() {
        App.hideModal();
        App.showToast('Đang khôi phục...', 'success');
        try {
            await Sync.restore();
            App.showToast('Khôi phục thành công!', 'success');
            App.navigate('home');
        } catch (e) {
            App.showToast(e.message || 'Lỗi khôi phục', 'error');
        }
    }

    function exportLocal() {
        const data = Store.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nhatro_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        App.showToast('Đã xuất file backup!', 'success');
    }

    function importLocal() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (!data.houses) throw new Error('File không hợp lệ');
                Store.importData(data);
                App.showToast('Đã nhập dữ liệu!', 'success');
                App.navigate('home');
            } catch (err) {
                App.showToast('File không hợp lệ', 'error');
            }
        };
        input.click();
    }

    function confirmClearData() {
        App.showModal('⚠️ Xóa toàn bộ dữ liệu', `
            <p style="font-size:1rem; margin-bottom:20px; color:var(--danger);">
                <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác!<br>
                Tất cả nhà trọ, phòng, hóa đơn sẽ bị xóa vĩnh viễn.
            </p>
            <div class="btn-group">
                <button class="btn btn-outline" onclick="App.hideModal()">Hủy</button>
                <button class="btn btn-danger" onclick="SettingsView.clearData()">Xóa tất cả</button>
            </div>
        `);
    }

    function clearData() {
        Store.importData({ houses: [] });
        App.hideModal();
        App.showToast('Đã xóa toàn bộ dữ liệu', 'success');
        App.navigate('home');
    }

    return {
        render, showSyncSetup, saveSyncSetup,
        syncNow, confirmRestore, doRestore,
        exportLocal, importLocal,
        confirmClearData, clearData
    };
})();
