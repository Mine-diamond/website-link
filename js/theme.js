(function() {
    'use strict';

    const THEME_KEY = 'user-theme';
    const THEME_TOGGLE_SELECTOR = '.theme-toggle'; // 使用 class 选择器

    const icon = (name) => `<i class="ri-${name} icon" aria-hidden="true"></i>`;

    /**
     * 应用指定的主题，并更新所有切换按钮的状态。
     * @param {string} theme - 'dark' 或 'light'
     */
    const applyTheme = (theme) => {
        const isDark = theme === 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        
        document.querySelectorAll(THEME_TOGGLE_SELECTOR).forEach(button => {
            if (button) {
                button.innerHTML = isDark ? icon('sun-line') : icon('moon-line');
                button.title = isDark ? '切换到亮色模式' : '切换到暗色模式';
                button.setAttribute('aria-label', button.title);
            }
        });
    };

    /**
     * 切换当前主题，并保存用户选择。
     */
    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, newTheme);
        applyTheme(newTheme);
    };

    /**
     * 初始化主题。
     * 优先级: 用户在 localStorage 的选择 > 操作系统偏好 > 默认亮色。
     */
    const initTheme = () => {
        const savedTheme = localStorage.getItem(THEME_KEY);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        applyTheme(initialTheme);
    };

    // --- 核心初始化逻辑 ---

    // 1. 确保在DOM加载后执行
    document.addEventListener('DOMContentLoaded', () => {
        // 2. 为所有主题切换按钮绑定现代的点击事件
        document.querySelectorAll(THEME_TOGGLE_SELECTOR).forEach(button => {
            if (button) {
                button.addEventListener('click', toggleTheme);
            }
        });

        // 3. 初始化主题
        initTheme();
    });

    // 4. 【重要】创建全局 ThemeManager 对象以实现向下兼容
    // 这可以确保项目中任何其他可能调用 ThemeManager.toggle() 的旧脚本不会出错。
    if (!window.ThemeManager) {
        window.ThemeManager = {};
    }
    window.ThemeManager.toggle = toggleTheme;

})();
