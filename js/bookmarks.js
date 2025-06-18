// js/bookmarks.js - 收藏夹页面逻辑（完全修正版）

let allBookmarks = [];
let currentBookmarks = [];
let searchTimeout;

// --- Helper Functions ---

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 提取域名
function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return url;
    }
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

// 创建图标HTML
function createIconHTML(bookmark) {
    if (bookmark.favicon) {
        // The result of createFallbackIconContent is a single character, safe for HTML attribute.
        // It's evaluated during string template construction.
        return `<img src="${bookmark.favicon}" alt="图标" onerror="this.outerHTML='${createFallbackIconContent(bookmark.title)}'">`;
    } else {
        return createFallbackIconContent(bookmark.title);
    }
}

// --- UI Utility Functions ---

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

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

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) { // Ensure container exists, initToastSystem might not have run or finished
        initToastSystem(); // Try to initialize if missing
        // Re-get container, if still not there, log error and exit
        const freshContainer = document.getElementById('toast-container');
        if (!freshContainer) {
            console.error("Toast container not found, cannot show toast.");
            return;
        }
    }
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
    
    toast.innerHTML = `${icons[type]} ${escapeHtml(message)}`; // Escape message content
    document.getElementById('toast-container').appendChild(toast); // Use the guaranteed existing container
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
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

// --- Bookmark Rendering Functions ---

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

// 添加卡片事件监听器
function addCardEventListeners() {
    document.querySelectorAll('.bookmark-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.card-actions')) return;
            
            const link = this.querySelector('.card-title a');
            if (link) {
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    window.open(link.href, '_blank');
                    this.style.transform = '';
                }, 150);
            }
        });
    });
}

// 渲染书签
function renderBookmarks() {
    const grid = document.getElementById('bookmarks-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (!grid || !emptyState) {
        console.error("Bookmarks grid or empty state element not found in DOM.");
        return;
    }
    
    if (currentBookmarks.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    currentBookmarks.sort((a, b) => {
        if (a.importance !== b.importance) {
            return b.importance - a.importance;
        }
        return new Date(b.dateAdded) - new Date(a.dateAdded);
    });
    
    grid.innerHTML = currentBookmarks.map(bookmark => createBookmarkCard(bookmark)).join('');
    addCardEventListeners();
}

// --- Core Application Logic / Event Handlers ---

// 加载书签
async function loadBookmarks() {
    showLoading();
    try {
        // Ensure bookmarkAPI and getBookmarks are available. This assumes bookmarkAPI.js loads correctly.
        if (typeof bookmarkAPI === 'undefined' || typeof bookmarkAPI.getBookmarks !== 'function') {
            throw new Error('bookmarkAPI is not available or getBookmarks is not a function.');
        }
        allBookmarks = await bookmarkAPI.getBookmarks();
        currentBookmarks = [...allBookmarks];
        renderBookmarks(); // Now renderBookmarks is guaranteed to be defined before this call.
    } catch (error) {
        console.error('加载书签失败:', error);
        showToast('加载书签失败: ' + error.message, 'error');
    }
    hideLoading();
}

// 搜索书签（防抖优化）
function searchBookmarks() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const queryInput = document.getElementById('search-input');
        const importanceInput = document.getElementById('importance-filter');

        if (!queryInput || !importanceInput) {
            console.error("Search or importance filter input not found.");
            return;
        }

        const query = queryInput.value.toLowerCase().trim();
        const importance = importanceInput.value;
        
        if (!query && !importance) {
            currentBookmarks = [...allBookmarks];
        } else {
            currentBookmarks = allBookmarks.filter(bookmark => {
                const matchesQuery = !query || 
                    (bookmark.title && bookmark.title.toLowerCase().includes(query)) ||
                    (bookmark.notes && bookmark.notes.toLowerCase().includes(query)) ||
                    (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(query))) ||
                    (bookmark.url && bookmark.url.toLowerCase().includes(query));
                
                const matchesImportance = !importance || bookmark.importance >= parseInt(importance);
                
                return matchesQuery && matchesImportance;
            });
        }
        
        renderBookmarks();
        
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
    const form = document.getElementById('bookmark-form');
    if (form) {
        form.reset();
        form.removeAttribute('data-edit-id');
    }
    document.getElementById('bookmark-modal').style.display = 'flex';
    
    setTimeout(() => {
        const titleInput = document.getElementById('bookmark-title');
        if (titleInput) titleInput.focus();
    }, 100);
}

// 关闭模态框
function closeBookmarkModal() {
    const modal = document.getElementById('bookmark-modal');
    if (modal) {
        modal.style.display = 'none';
    }
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
        const titleInput = document.getElementById('bookmark-title');
        if (titleInput) titleInput.focus();
    }, 100);
}

// 删除书签
async function deleteBookmark(id) {
    const bookmark = allBookmarks.find(b => b.id === id);
    if (!bookmark) return;
    
    const confirmed = await showConfirmDialog(
        '确认删除', 
        `确定要删除书签"${escapeHtml(bookmark.title)}"吗？此操作无法撤销。` // Escape title in confirm
    );
    
    if (!confirmed) return;
    
    try {
        if (typeof bookmarkAPI === 'undefined' || typeof bookmarkAPI.deleteBookmark !== 'function') {
            throw new Error('bookmarkAPI is not available or deleteBookmark is not a function.');
        }
        await bookmarkAPI.deleteBookmark(id);
        await loadBookmarks(); // Reload all bookmarks
        showToast('📚 书签已删除', 'success');
    } catch (error) {
        console.error('删除书签失败:', error);
        showToast('删除失败: ' + error.message, 'error');
    }
}

// --- Initializers / Event Listeners ---

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initToastSystem(); // Initialize toast system early
    loadBookmarks();   // Then load bookmarks
    
    // Assign event listeners that depend on DOM elements being ready
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', searchBookmarks);
    }

    const importanceFilter = document.getElementById('importance-filter');
    if (importanceFilter) {
        importanceFilter.addEventListener('change', filterBookmarks);
    }
    
    const addBookmarkBtn = document.querySelector('.add-bookmark-btn');
    if (addBookmarkBtn) {
        addBookmarkBtn.onclick = openAddBookmarkModal; // Keep existing onclick or change to addEventListener
    }
});

// 处理表单提交
const bookmarkForm = document.getElementById('bookmark-form');
if (bookmarkForm) {
    bookmarkForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('bookmark-title').value.trim();
        const url = document.getElementById('bookmark-url').value.trim();
        
        if (!title || !url) {
            showToast('请填写标题和网址', 'warning');
            return;
        }
        
        try {
            new URL(url);
        } catch (err) {
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
            if (typeof bookmarkAPI === 'undefined' || 
                (editId && typeof bookmarkAPI.updateBookmark !== 'function') ||
                (!editId && typeof bookmarkAPI.addBookmark !== 'function')) {
                throw new Error('bookmarkAPI or required methods are not available.');
            }

            if (editId) {
                await bookmarkAPI.updateBookmark({ ...formData, id: editId });
                showToast('📝 书签已更新', 'success');
            } else {
                await bookmarkAPI.addBookmark(formData);
                showToast('✨ 书签已添加', 'success');
            }
            
            closeBookmarkModal();
            await loadBookmarks(); // Reload all bookmarks
        } catch (error) {
            console.error('保存书签失败:', error);
            showToast('保存失败: ' + error.message, 'error');
        }
    });
}

// 点击模态框外部关闭
const bookmarkModal = document.getElementById('bookmark-modal');
if (bookmarkModal) {
    bookmarkModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeBookmarkModal();
        }
    });
}

// ESC键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('bookmark-modal');
        if (modal && modal.style.display !== 'none') {
            closeBookmarkModal();
        }
    }
});

// --- Global Exports (if necessary) ---
// window.createFallbackIconContent = createFallbackIconContent; // Already exposed as needed by onerror
// Expose functions called by inline HTML event attributes, if not already handled by addEventListener
window.editBookmark = editBookmark;
window.deleteBookmark = deleteBookmark;
// The openAddBookmarkModal, searchBookmarks, filterBookmarks are already handled by addEventListener or direct assignment if preferred.
// If you keep onclick in HTML for these, they also need to be on `window`.
// It's generally better to use addEventListener for all event handling.
// For example, for search input:
// document.getElementById('search-input').addEventListener('keyup', searchBookmarks);
// And remove onkeyup from HTML. Same for onchange on the select.
// The provided HTML already uses onclick for add-bookmark-btn, edit, delete. So these need to be global.
// searchBookmarks and filterBookmarks are assigned via onkeyup/onchange in HTML, so they also need to be global.
window.searchBookmarks = searchBookmarks;
window.filterBookmarks = filterBookmarks;
window.openAddBookmarkModal = openAddBookmarkModal; // If onclick="openAddBookmarkModal()" is kept in HTML