/**
 * Navbar - Bottom navigation controller
 */
const Navbar = (() => {
    function init() {
        const btns = document.querySelectorAll('.nav-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                App.navigate(view);
            });
        });
    }

    function setActive(view) {
        const btns = document.querySelectorAll('.nav-btn');
        btns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    }

    function show() {
        document.getElementById('bottom-nav').classList.remove('hidden');
    }

    function hide() {
        document.getElementById('bottom-nav').classList.add('hidden');
    }

    return { init, setActive, show, hide };
})();
