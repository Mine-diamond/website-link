const CardManager = {
    init() {
        this.renderGroups();
        this.initEventListeners();
        this.createCopyNotification();
        // 确保所有分组都已经渲染后发出一个事件
        document.dispatchEvent(new CustomEvent('groupsRendered'));
    },
    renderGroups() {
        const container = document.querySelector('main');
        container.innerHTML = '';
        
        // 确保每个分组的ID使用一致的方式生成
        appConfig.groups.forEach((group, index) => {
            const groupId = `group-${Utils.slugify(group.title)}`;
            
            const groupElement = document.createElement('section');
            groupElement.className = 'service-group';
            groupElement.id = groupId;
            groupElement.dataset.index = index; // 添加索引以便调试
            
            const titleElement = document.createElement('h2');
            titleElement.className = 'service-group__title';
            titleElement.textContent = group.title;
            groupElement.appendChild(titleElement);
            
            const cardGrid = document.createElement('div');
            cardGrid.className = 'card-grid';
            
            // 为每个服务项创建卡片
            group.items.forEach(item => {
                // 创建卡片元素
                const card = document.createElement('button');
                card.className = 'service-card';
                card.dataset.url = item.url;
                card.setAttribute('role', 'link');
                card.setAttribute('aria-label', `访问${item.label}`);
                card.textContent = item.label;
                
                // 创建复制按钮
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-url-btn';
                copyBtn.dataset.url = item.url;
                copyBtn.setAttribute('aria-label', '复制链接');
                copyBtn.setAttribute('title', '复制链接');
                copyBtn.textContent = '📋';
                card.appendChild(copyBtn);
                
                // 如果有徽章，添加徽章
                if (item.badge) {
                    const badge = document.createElement('span');
                    badge.className = 'service-card__badge';
                    badge.textContent = item.badge;
                    card.appendChild(badge);
                }
                
                cardGrid.appendChild(card);
            });
            
            groupElement.appendChild(cardGrid);
            container.appendChild(groupElement);
        });
        
        // 打印调试信息
        console.log('已渲染分组:', [...document.querySelectorAll('.service-group')].map(el => ({ id: el.id, title: el.querySelector('.service-group__title').textContent })));
    },
    initEventListeners() {
        document.querySelector('main').addEventListener('click', (e) => {
            // 处理复制URL按钮点击
            if (e.target.classList.contains('copy-url-btn')) {
                e.stopPropagation(); // 阻止事件冒泡到卡片
                this.copyToClipboard(e.target.dataset.url);
                return;
            }

            // 处理卡片点击
            const card = e.target.closest('.service-card');
            if (card) {
                card.style.transform = 'scale(0.97)';
                setTimeout(() => {
                    window.open(card.dataset.url, '_blank');
                    card.style.transform = '';
                }, 150);
            }
        });
    },
    createCopyNotification() {
        const notification = document.createElement('div');
        notification.className = 'copy-success';
        notification.textContent = '链接已复制到剪贴板';
        document.body.appendChild(notification);
        this.notification = notification;
    },
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // 显示成功通知
            this.notification.classList.add('show');
            setTimeout(() => {
                this.notification.classList.remove('show');
            }, 2000);
        }).catch(err => {
            console.error('无法复制文本: ', err);
            // 尝试备用复制方法
            this.fallbackCopyToClipboard(text);
        });
    },
    fallbackCopyToClipboard(text) {
        // 创建一个临时的文本区域元素
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.notification.classList.add('show');
                setTimeout(() => {
                    this.notification.classList.remove('show');
                }, 2000);
            }
        } catch (err) {
            console.error('备用复制方法失败: ', err);
        }
        
        document.body.removeChild(textarea);
    }
};
