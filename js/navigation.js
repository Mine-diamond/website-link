const NavigationManager = {
    init() {
        // 创建一个标志来跟踪是否已经初始化
        this.initialized = false;
        
        // 立即尝试初始化
        this.tryInitialize();
        
        // 同时也监听groupsRendered事件，以防服务组尚未渲染完成
        document.addEventListener('groupsRendered', () => {
            this.tryInitialize();
        });
    },
    
    tryInitialize() {
        // 如果已经初始化过，就不再初始化
        if (this.initialized) {
            return;
        }
        
        // 检查是否已经有服务组渲染完成
        const serviceGroups = document.querySelectorAll('.service-group');
        if (serviceGroups.length > 0) {
            this.createGroupNavigationDropdown();
            this.initEventListeners();
            this.initialized = true;
        }
    },
    
    createGroupNavigationDropdown() {
        const dropdown = document.querySelector('.group-nav-dropdown');
        // 清空下拉菜单
        dropdown.innerHTML = '';
        
        // 获取所有已渲染的分组
        const renderedGroups = document.querySelectorAll('.service-group');
        console.log('导航创建时的渲染分组:', [...renderedGroups].map(el => el.id));
        
        // 为每个分组创建一个导航项
        appConfig.groups.forEach((group, index) => {
            const groupId = `group-${Utils.slugify(group.title)}`;
            
            // 验证目标元素是否存在
            const targetExists = document.getElementById(groupId) !== null;
            
            const button = document.createElement('button');
            button.className = 'group-nav-item';
            button.dataset.target = groupId;
            button.dataset.index = index;
            button.textContent = group.title;
            
            if (!targetExists) {
                console.warn(`警告: 导航目标 "${groupId}" 不存在`);
                button.classList.add('nav-target-missing');
            }
            
            dropdown.appendChild(button);
        });
    },
    
    initEventListeners() {
        const toggle = document.querySelector('.group-nav-toggle');
        const dropdown = document.querySelector('.group-nav-dropdown');
        
        // 点击切换下拉菜单的显示/隐藏
        toggle.addEventListener('click', () => {
            dropdown.classList.toggle('active');
        });
        
        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.group-navigation')) {
                dropdown.classList.remove('active');
            }
        });
        
        // 点击导航项滚动到对应分组
        dropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('group-nav-item')) {
                const title = e.target.textContent;
                
                console.log('点击的导航项:', title);
                
                // 通过标题查找目标元素
                const groups = document.querySelectorAll('.service-group');
                const targetGroup = [...groups].find(group => 
                    group.querySelector('.service-group__title').textContent === title
                );
                
                if (targetGroup) {
                    // 滚动到目标元素
                    targetGroup.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // 高亮目标元素
                    targetGroup.style.boxShadow = '0 0 0 3px var(--text-color)';
                    setTimeout(() => {
                        targetGroup.style.boxShadow = '';
                    }, 2000);
                    
                    // 关闭下拉菜单
                    dropdown.classList.remove('active');
                } else {
                    console.error(`找不到标题为 "${title}" 的服务组`);
                }
            }
        });
    }
    
};
