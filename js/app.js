/**
 * App - Main router and utilities for Nhà Trọ PWA
 */
const App = (() => {
    let navigationStack = [];
    const PIN_KEY = 'nhatro_pin';
    let isUnlocked = false;

    // --- Router ---
    function navigate(view, ...params) {
        // Save to stack for back navigation
        const current = window.location.hash;
        if (current && view !== 'home') {
            navigationStack.push(current);
        }

        if (view === 'home') {
            navigationStack = [];
            window.location.hash = '#home';
        } else {
            window.location.hash = '#' + view + '/' + params.join('/');
        }
    }

    function handleRoute() {
        const hash = window.location.hash || '#home';
        const parts = hash.replace('#', '').split('/');
        const view = parts[0];

        switch (view) {
            case 'home':
            case '':
                HomeView.render();
                break;
            case 'house':
                HouseView.render(parts[1]);
                break;
            case 'room':
                RoomView.render(parts[1], parts[2]);
                break;
            case 'billing':
                BillingView.render(parts[1], parts[2], parts[3]);
                break;
            case 'history':
                renderHistoryView();
                break;
            case 'settings':
                SettingsView.render();
                break;
            default:
                HomeView.render();
        }
    }

    // --- History View (all invoices) ---
    function renderHistoryView() {
        setHeader('Hóa đơn', false);
        Navbar.show();
        Navbar.setActive('history');

        const container = document.getElementById('main-content');
        const allMeters = Store.getAllMeters();

        if (allMeters.length === 0) {
            container.innerHTML = `
                <div class="empty-state fade-in">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <p>Chưa có hóa đơn nào.<br>Hãy nhập chỉ số điện nước cho các phòng!</p>
                </div>
            `;
            return;
        }

        // Group by month
        const groups = {};
        for (const m of allMeters) {
            if (!groups[m.month]) groups[m.month] = [];
            groups[m.month].push(m);
        }

        let html = '<div class="fade-in">';
        for (const [month, meters] of Object.entries(groups)) {
            const totalUnpaid = meters.filter(m => !m.paid).length;
            const totalAmount = meters.reduce((sum, m) => sum + (m.totalAmount || 0), 0);

            html += `<div class="section-title">${Store.formatMonth(month)} — ${meters.length} hóa đơn${totalUnpaid > 0 ? ` (${totalUnpaid} chưa thu)` : ''}</div>`;

            for (const m of meters) {
                html += `
                    <div class="card" onclick="App.navigate('billing', '${m.houseId}', '${m.roomId}', '${m.month}')" style="padding:14px 20px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:600;">${m.roomName}</div>
                                <div style="font-size:0.8rem; color:var(--text-secondary);">
                                    ${m.houseName} • ${m.tenantName || 'Trống'}
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-weight:700;">${Store.formatCurrency(m.totalAmount)}</div>
                                <span class="status-badge ${m.paid ? 'paid' : 'unpaid'}" style="font-size:0.7rem; padding:2px 8px;">
                                    ${m.paid ? '✅' : '⏳'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        html += '</div>';
        container.innerHTML = html;
    }

    // --- Header ---
    function setHeader(title, showBack) {
        document.getElementById('header-title').textContent = title;
        const backBtn = document.getElementById('btn-back');
        if (showBack) {
            backBtn.classList.remove('hidden');
            backBtn.onclick = goBack;
        } else {
            backBtn.classList.add('hidden');
        }
    }

    function goBack() {
        if (navigationStack.length > 0) {
            const prev = navigationStack.pop();
            window.location.hash = prev;
        } else {
            window.history.back();
        }
    }

    // --- Toast ---
    let toastTimeout = null;
    function showToast(message, type) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast ' + (type || '');
        // Force reflow
        toast.offsetHeight;
        toast.classList.add('show');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // --- Modal ---
    function showModal(title, contentHtml) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');

        content.innerHTML = `
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close" onclick="App.hideModal()">✕</button>
            </div>
            ${contentHtml}
        `;

        overlay.classList.remove('hidden');
        // Force reflow
        overlay.offsetHeight;
        overlay.classList.add('show');

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) hideModal();
        };
    }

    function hideModal() {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.remove('show');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }

    // --- PIN Lock ---
    function hasPin() {
        return !!localStorage.getItem(PIN_KEY);
    }

    function checkPin() {
        // Already unlocked this session
        if (sessionStorage.getItem('nhatro_unlocked') === 'true') {
            isUnlocked = true;
            return true;
        }
        return false;
    }

    function showPinScreen(isSetup) {
        const app = document.getElementById('app');
        app.style.display = 'none';

        // Remove old lock screen if exists
        const old = document.getElementById('pin-screen');
        if (old) old.remove();

        const screen = document.createElement('div');
        screen.id = 'pin-screen';
        screen.innerHTML = `
            <div style="min-height:100dvh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--bg); padding:32px;">
                <div style="font-size:3rem; margin-bottom:16px;">🏠</div>
                <h1 style="font-size:1.5rem; font-weight:700; color:var(--primary); margin-bottom:8px;">Nhà Trọ</h1>
                <p style="color:var(--text-secondary); margin-bottom:32px; text-align:center;">
                    ${isSetup ? 'Tạo mã PIN 4 số để bảo vệ ứng dụng' : 'Nhập mã PIN để mở khóa'}
                </p>
                <div style="display:flex; gap:12px; margin-bottom:24px;" id="pin-dots">
                    <div class="pin-dot"></div>
                    <div class="pin-dot"></div>
                    <div class="pin-dot"></div>
                    <div class="pin-dot"></div>
                </div>
                <p id="pin-error" style="color:var(--danger); font-size:0.9rem; min-height:24px; margin-bottom:16px;"></p>
                <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; max-width:280px; width:100%;">
                    ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(n => 
                        n === '' ? '<div></div>' : 
                        `<button class="pin-key" onclick="App.pinInput('${n}')" style="
                            width:72px; height:72px; border-radius:50%; border:2px solid var(--border);
                            background:var(--surface); font-size:${n === '⌫' ? '1.3rem' : '1.5rem'}; font-weight:600;
                            font-family:var(--font); cursor:pointer; display:flex; align-items:center;
                            justify-content:center; margin:0 auto;
                            transition: background 0.15s;
                        ">${n}</button>`
                    ).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(screen);
    }

    let pinBuffer = '';
    let pinSetupFirst = '';

    function pinInput(key) {
        const isSetup = !hasPin();

        if (key === '⌫') {
            pinBuffer = pinBuffer.slice(0, -1);
        } else {
            if (pinBuffer.length < 4) {
                pinBuffer += key;
            }
        }

        // Update dots
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach((dot, i) => {
            dot.style.background = i < pinBuffer.length ? 'var(--primary)' : 'transparent';
        });

        if (pinBuffer.length === 4) {
            setTimeout(() => {
                if (isSetup) {
                    handlePinSetup();
                } else {
                    handlePinVerify();
                }
            }, 200);
        }
    }

    function handlePinSetup() {
        if (!pinSetupFirst) {
            // First entry
            pinSetupFirst = pinBuffer;
            pinBuffer = '';
            document.getElementById('pin-error').textContent = '';
            document.querySelectorAll('.pin-dot').forEach(d => d.style.background = 'transparent');
            document.querySelector('#pin-screen p').textContent = 'Nhập lại mã PIN để xác nhận';
        } else {
            // Confirm
            if (pinBuffer === pinSetupFirst) {
                localStorage.setItem(PIN_KEY, pinBuffer);
                sessionStorage.setItem('nhatro_unlocked', 'true');
                isUnlocked = true;
                unlockApp();
            } else {
                document.getElementById('pin-error').textContent = 'Mã PIN không khớp, thử lại';
                pinBuffer = '';
                pinSetupFirst = '';
                document.querySelectorAll('.pin-dot').forEach(d => d.style.background = 'transparent');
                document.querySelector('#pin-screen p').textContent = 'Tạo mã PIN 4 số để bảo vệ ứng dụng';
            }
        }
    }

    function handlePinVerify() {
        const savedPin = localStorage.getItem(PIN_KEY);
        if (pinBuffer === savedPin) {
            sessionStorage.setItem('nhatro_unlocked', 'true');
            isUnlocked = true;
            unlockApp();
        } else {
            document.getElementById('pin-error').textContent = 'Sai mã PIN, thử lại';
            pinBuffer = '';
            document.querySelectorAll('.pin-dot').forEach(d => d.style.background = 'transparent');
            // Shake animation
            const dots = document.getElementById('pin-dots');
            dots.style.animation = 'shake 0.3s';
            setTimeout(() => dots.style.animation = '', 300);
        }
    }

    function unlockApp() {
        const screen = document.getElementById('pin-screen');
        if (screen) screen.remove();
        document.getElementById('app').style.display = '';
        handleRoute();
    }

    function changePin() {
        showModal('Đổi mã PIN', `
            <div class="form-group">
                <label class="form-label">Mã PIN hiện tại</label>
                <input class="form-input" type="password" id="input-old-pin" maxlength="4" inputmode="numeric" pattern="[0-9]*" placeholder="Nhập 4 số">
            </div>
            <div class="form-group">
                <label class="form-label">Mã PIN mới</label>
                <input class="form-input" type="password" id="input-new-pin" maxlength="4" inputmode="numeric" pattern="[0-9]*" placeholder="Nhập 4 số">
            </div>
            <div class="form-group">
                <label class="form-label">Nhập lại mã PIN mới</label>
                <input class="form-input" type="password" id="input-confirm-pin" maxlength="4" inputmode="numeric" pattern="[0-9]*" placeholder="Nhập 4 số">
            </div>
            <button class="btn btn-primary mt-16" onclick="App.saveNewPin()">💾 Đổi mã PIN</button>
        `);
    }

    function saveNewPin() {
        const oldPin = document.getElementById('input-old-pin').value;
        const newPin = document.getElementById('input-new-pin').value;
        const confirmPin = document.getElementById('input-confirm-pin').value;

        if (oldPin !== localStorage.getItem(PIN_KEY)) {
            showToast('Mã PIN cũ không đúng', 'error');
            return;
        }
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            showToast('Mã PIN phải là 4 số', 'error');
            return;
        }
        if (newPin !== confirmPin) {
            showToast('Mã PIN mới không khớp', 'error');
            return;
        }

        localStorage.setItem(PIN_KEY, newPin);
        hideModal();
        showToast('Đã đổi mã PIN!', 'success');
    }

    // --- Init ---
    function init() {
        // Init modules
        Navbar.init();
        Sync.init();

        // Handle routes
        window.addEventListener('hashchange', () => {
            if (isUnlocked) handleRoute();
        });

        // Close modal on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') hideModal();
        });

        // Check PIN
        if (checkPin()) {
            // Already unlocked
            handleRoute();
        } else if (!hasPin()) {
            // First time: setup PIN
            showPinScreen(true);
        } else {
            // Locked: ask for PIN
            showPinScreen(false);
        }

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.log('SW registration failed:', err);
            });
        }

        console.log('🏠 Nhà Trọ app initialized');
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);

    return { navigate, setHeader, showToast, showModal, hideModal, goBack, pinInput, changePin, saveNewPin };
})();
