const NavigationManager = {
    init() {
        // 等待分组渲染完毕，再创建导航
        if (document.querySelectorAll('.service-group').length > 0) {
            this.createGroupNavigationDropdown();
            this.initEventListeners();
        } else {
            // 如果分组尚未渲染，等待渲染完成事件
            document.addEventListener('groupsRendered', () => {
                this.createGroupNavigationDropdown();
                this.initEventListeners();
            });
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
                const targetId = e.target.dataset.target;
                const targetElement = document.getElementById(targetId);
                
                console.log('点击的导航项:', e.target.textContent);
                console.log('目标ID:', targetId);
                console.log('目标元素:', targetElement);
                
                if (targetElement) {
                    // 滚动到目标元素
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // 高亮目标元素
                    targetElement.style.boxShadow = '0 0 0 3px var(--text-color)';
                    setTimeout(() => {
                        targetElement.style.boxShadow = '';
                    }, 2000);
                    
                    // 关闭下拉菜单
                    dropdown.classList.remove('active');
                } else {
                    console.error(`找不到目标元素: ${targetId}`);
                    // 尝试按索引查找并滚动
                    const index = parseInt(e.target.dataset.index, 10);
                    const groups = document.querySelectorAll('.service-group');
                    if (!isNaN(index) && groups[index]) {
                        groups[index].scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                        groups[index].style.boxShadow = '0 0 0 3px var(--text-color)';
                        setTimeout(() => {
                            groups[index].style.boxShadow = '';
                        }, 2000);
                        dropdown.classList.remove('active');
                    }
                }
            }
        });
    }
};
