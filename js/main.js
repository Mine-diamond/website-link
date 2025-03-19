function initApp() {
    ThemeManager.init();
    // 先渲染卡片，再初始化导航
    CardManager.init();
    SearchManager.init();
    // 确保导航在卡片渲染后初始化
    NavigationManager.init();
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // 移动端点击延迟处理
    if ('ontouchstart' in window) {
        document.documentElement.style.touchAction = 'manipulation';
    }
}

// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', initApp);
