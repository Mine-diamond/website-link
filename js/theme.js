const ThemeManager = {
    init() {
        this.applySavedTheme();
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' && e.altKey) this.toggle();
        });
    },
    toggle() {
        const newTheme = document.body.dataset.theme === 'dark' ? '' : 'dark';
        document.body.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
    },
    applySavedTheme() {
        document.body.dataset.theme = localStorage.getItem('theme') || '';
    }
};
