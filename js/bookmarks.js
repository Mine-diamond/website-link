// js/bookmarks.js - 收藏夹页面逻辑（完全修正版）

let allBookmarks = [];
let currentBookmarks = [];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadBookmarks();
    initToastSystem();
});

// 初始化Toast通知系统
function initToastSystem() {
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
}

// 加载书签
async function loadBookmarks() {
    showLoading();
    try {
        allBookmarks = await bookmarkAPI.getBookmarks();
        currentBookmarks = [...allBookmarks];
        renderBookmarks();
    } catch (error) {
        console.error('加载书签失败:', error);
        showToast('加载书签失败: ' + error.message, 'error');
    }
    hideLoading();
}

// 渲染书签
function renderBookmarks() {
    const grid = document.getElementById('bookmarks-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (currentBookmarks.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // 按重要程度和时间排序
    currentBookmarks.sort((a, b) => {
        if (a.importance !== b.importance) {
            return b.importance - a.importance;
        }
        return new Date(b.dateAdded) - new Date(a.dateAdded);
    });
    
    grid.innerHTML = currentBookmarks.map(bookmark => createBookmarkCard(bookmark)).join('');
    
    // 添加卡片点击事件
    addCardEventListeners();
}

// 创建书签卡片HTML（新设计）
function createBookmarkCard(bookmark) {
    const stars = createStarsHTML(bookmark.importance);
    const tags = bookmark.tags.slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
    const domain = extractDomain(bookmark.url);
    const iconHtml = createIconHTML(bookmark);
    const secondaryInfo = bookmark.notes || domain;
    const dateText = formatDate(bookmark.dateAdded);
    
    return `
        <div class="bookmark-card" data-id="${bookmark.id}">
            <div class="card-actions">
                <button class="action-btn edit" onclick="editBookmark('${bookmark.id}')" title="编辑">
                    ✏️
                </button>
                <button class="action-btn delete" onclick="deleteBookmark('${bookmark.id}')" title="删除">
                    🗑️
                </button>
            </div>
            
            <div class="card-header">
                <div class="card-favicon ${bookmark.favicon ? '' : 'fallback'}">
                    ${iconHtml}
                </div>
                <h3 class="card-title">
                    <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer">
                        ${escapeHtml(bookmark.title)}
                    </a>
                </h3>
            </div>
            
            <div class="card-secondary">${escapeHtml(secondaryInfo)}</div>
            
            <div class="card-bottom">
                <div class="bookmark-tags">${tags}</div>
                <div class="importance-stars">${stars}</div>
            </div>
            
            <div class="card-date">${dateText}</div>
        </div>
    `;
}

// 创建图标HTML
function createIconHTML(bookmark) {
    if (bookmark.favicon) {
        return `<img src="${bookmark.favicon}" alt="图标" onerror="this.outerHTML='${createFallbackIconContent(bookmark.title)}'">`;
    } else {
        return createFallbackIconContent(bookmark.title);
    }
}

// 创建备用图标内容
function createFallbackIconContent(title) {
    const firstChar = title.charAt(0).toUpperCase();
    return firstChar;
}

// 创建星级HTML
function createStarsHTML(importance) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= importance) {
            starsHTML += '<span class="star">★</span>';
        } else {
            starsHTML += '<span class="star empty">★</span>';
        }
    }
    return starsHTML;
}

// 提取域名
function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return url;
    }
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 时间格式化
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '今天';
    if (diffDays === 2) return '昨天';
    if (diffDays <= 7) return `${diffDays}天前`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周前`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)}个月前`;
    return `${Math.ceil(diffDays / 365)}年前`;
}

// 添加卡片事件监听器
function addCardEventListeners() {
    document.querySelectorAll('.bookmark-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // 如果点击的是操作按钮，不触发卡片点击
            if (e.target.closest('.card-actions')) return;
            
            const link = this.querySelector('.card-title a');
            if (link) {
                // 添加点击反馈
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    window.open(link.href, '_blank');
                    this.style.transform = '';
                }, 150);
            }
        });
    });
}

// 搜索书签（防抖优化）
let searchTimeout;
function searchBookmarks() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = document.getElementById('search-input').value.toLowerCase().trim();
        const importance = document.getElementById('importance-filter').value;
        
        if (!query && !importance) {
            currentBookmarks = [...allBookmarks];
        } else {
            currentBookmarks = allBookmarks.filter(bookmark => {
                const matchesQuery = !query || 
                    bookmark.title.toLowerCase().includes(query) ||
                    bookmark.notes.toLowerCase().includes(query) ||
                    bookmark.tags.some(tag => tag.toLowerCase().includes(query)) ||
                    bookmark.url.toLowerCase().includes(query);
                
                const matchesImportance = !importance || bookmark.importance >= parseInt(importance);
                
                return matchesQuery && matchesImportance;
            });
        }
        
        renderBookmarks();
        
        // 搜索结果提示
        if (query && currentBookmarks.length === 0) {
            showToast(`没有找到包含"${query}"的书签`, 'info');
        }
    }, 300);
}

// 重要程度过滤
function filterBookmarks() {
    searchBookmarks();
}

// 打开添加书签模态框
function openAddBookmarkModal() {
    document.getElementById('modal-title').textContent = '✨ 添加新书签';
    document.getElementById('bookmark-form').reset();
    document.getElementById('bookmark-form').removeAttribute('data-edit-id');
    document.getElementById('bookmark-modal').style.display = 'flex';
    
    // 聚焦到标题输入框
    setTimeout(() => {
        document.getElementById('bookmark-title').focus();
    }, 100);
}

// 关闭模态框
function closeBookmarkModal() {
    document.getElementById('bookmark-modal').style.display = 'none';
}

// 编辑书签
function editBookmark(id) {
    const bookmark = allBookmarks.find(b => b.id === id);
    if (!bookmark) return;
    
    document.getElementById('modal-title').textContent = '✏️ 编辑书签';
    document.getElementById('bookmark-title').value = bookmark.title;
    document.getElementById('bookmark-url').value = bookmark.url;
    document.getElementById('bookmark-tags').value = bookmark.tags.join(', ');
    document.getElementById('bookmark-notes').value = bookmark.notes;
    document.getElementById('bookmark-importance').value = bookmark.importance;
    
    document.getElementById('bookmark-form').setAttribute('data-edit-id', id);
    document.getElementById('bookmark-modal').style.display = 'flex';
    
    setTimeout(() => {
        document.getElementById('bookmark-title').focus();
    }, 100);
}

// 删除书签
async function deleteBookmark(id) {
    const bookmark = allBookmarks.find(b => b.id === id);
    if (!bookmark) return;
    
    const confirmed = await showConfirmDialog(
        '确认删除', 
        `确定要删除书签"${bookmark.title}"吗？此操作无法撤销。`
    );
    
    if (!confirmed) return;
    
    try {
        await bookmarkAPI.deleteBookmark(id);
        await loadBookmarks();
        showToast('📚 书签已删除', 'success');
    } catch (error) {
        console.error('删除书签失败:', error);
        showToast('删除失败: ' + error.message, 'error');
    }
}

// 处理表单提交
document.getElementById('bookmark-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('bookmark-title').value.trim();
    const url = document.getElementById('bookmark-url').value.trim();
    
    if (!title || !url) {
        showToast('请填写标题和网址', 'warning');
        return;
    }
    
    // URL格式验证
    try {
        new URL(url);
    } catch (e) {
        showToast('请输入有效的网址格式', 'warning');
        return;
    }
    
    const formData = {
        title: title,
        url: url,
        tags: document.getElementById('bookmark-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag),
        notes: document.getElementById('bookmark-notes').value.trim(),
        importance: parseInt(document.getElementById('bookmark-importance').value)
    };
    
    const editId = this.getAttribute('data-edit-id');
    
    try {
        if (editId) {
            await bookmarkAPI.updateBookmark({ ...formData, id: editId });
            showToast('📝 书签已更新', 'success');
        } else {
            await bookmarkAPI.addBookmark(formData);
            showToast('✨ 书签已添加', 'success');
        }
        
        closeBookmarkModal();
        await loadBookmarks();
    } catch (error) {
        console.error('保存书签失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
});

// 点击模态框外部关闭
document.getElementById('bookmark-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeBookmarkModal();
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('bookmark-modal').style.display !== 'none') {
        closeBookmarkModal();
    }
});

// 工具函数
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const icons = {
        success: '✅',
        error: '❌', 
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    toast.style.cssText = `
        background: ${colors[type]};
        color: white;
        padding: 10px 16px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
        font-size: 14px;
        max-width: 320px;
        pointer-events: auto;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    toast.innerHTML = `${icons[type]} ${message}`;
    container.appendChild(toast);
    
    // 动画进入
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // 自动消失
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const confirmed = confirm(`${title}\n\n${message}`);
        resolve(confirmed);
    });
}

// 全局函数暴露（供HTML中的onclick使用）
window.createFallbackIconContent = createFallbackIconContent;
