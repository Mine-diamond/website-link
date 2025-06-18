// js/theme.js (统一和优化后的版本)

// 使用立即调用函数表达式 (IIFE) 来避免污染全局作用域
(function() {
    const THEME_KEY = 'user-theme';
    const LIGHT_THEME_ICON = '🌙'; // 亮色模式下显示的图标 (切换到暗色)
    const DARK_THEME_ICON = '☀️';  // 暗色模式下显示的图标 (切换到亮色)

    /**
     * 应用指定的主题，并更新所有切换按钮的图标和标题。
     * @param {string} theme - 'dark' 或 'light'
     */
    const applyTheme = (theme) => {
        const isDark = theme === 'dark';
        // 设置 <html> 元素的 data-theme 属性，让 CSS 变量生效
        document.documentElement.setAttribute('data-theme', theme);
        
        // 找到页面上所有的主题切换按钮并更新它们
        document.querySelectorAll('.theme-toggle').forEach(button => {
            button.textContent = isDark ? DARK_THEME_ICON : LIGHT_THEME_ICON;
            button.setAttribute('title', isDark ? '切换到亮色模式' : '切换到暗色模式');
        });
    };

    /**
     * 切换当前主题，并保存到 localStorage。
     */
    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, newTheme); // 保存用户选择
        applyTheme(newTheme);
    };

    /**
     * 当页面加载时，确定并应用初始主题。
     * 优先级: localStorage > 系统偏好 > 默认亮色
     */
    const initTheme = () => {
        const savedTheme = localStorage.getItem(THEME_KEY);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 应用初始主题
        applyTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));

        // 监听系统主题变化，仅在用户未手动设置主题时跟随系统
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(THEME_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    };

    // 确保在DOM加载完毕后执行所有操作
    document.addEventListener('DOMContentLoaded', () => {
        // 为页面上所有 class="theme-toggle" 的按钮绑定点击事件
        document.querySelectorAll('.theme-toggle').forEach(button => {
            button.addEventListener('click', toggleTheme);
        });

        // 初始化主题
        initTheme();
    });

})();