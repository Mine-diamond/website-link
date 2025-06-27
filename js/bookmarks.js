// js/bookmarks.js - 收藏夹页面逻辑（最终修正版）

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 状态管理 ---
    let allBookmarks = [];
    let currentBookmarks = [];
    let searchTimeout;
    
    // --- DOM 元素引用 ---
    const grid = document.getElementById('bookmarks-grid');
    const emptyState = document.getElementById('empty-state');
    const loadingIndicator = document.getElementById('loading');
    const searchInput = document.getElementById('search-input');
    const importanceFilter = document.getElementById('importance-filter');
    const addBookmarkBtn = document.querySelector('.add-bookmark-btn');
    const modal = document.getElementById('bookmark-modal');
    const modalTitle = document.getElementById('modal-title');
    const bookmarkForm = document.getElementById('bookmark-form');
    const cancelButton = modal.querySelector('.btn-secondary');

    // 关键UI元素检查，确保页面结构正确
    if (!grid || !emptyState || !loadingIndicator || !modal || !bookmarkForm || !addBookmarkBtn || !cancelButton) {
        console.error("关键UI元素缺失，脚本无法正常运行。请检查HTML ID和class是否正确。");
        return;
    }

    // --- Helper Functions ---

    function escapeHtml(text) {
        if (text === null || typeof text === 'undefined') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url || '';
        }
    }
    
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 1) return '今天';
            if (diffDays === 2) return '昨天';
            if (diffDays <= 7) return `${diffDays}天前`;
            if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周前`;
            if (diffDays <= 365) return `${Math.ceil(diffDays / 30)}个月前`;
            return `${Math.ceil(diffDays / 365)}年前`;
        } catch (e) {
            return '未知日期';
        }
    }

    function createFallbackIconContent(title) {
        return (title || ' ').charAt(0).toUpperCase();
    }
    
    function createStarsHTML(importance) {
        let starsHTML = '';
        const imp = parseInt(importance) || 0;
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<span class="star ${i <= imp ? '' : 'empty'}">★</span>`;
        }
        return starsHTML;
    }

    // --- UI Utility Functions ---

    function showLoading() { loadingIndicator.style.display = 'flex'; }
    function hideLoading() { loadingIndicator.style.display = 'none'; }
    
    function initToastSystem() {
        if (document.getElementById('toast-container')) return;
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
        document.body.appendChild(container);
    }

    function showToast(message, type = 'info') {
        initToastSystem();
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
        
        toast.style.cssText = `background: ${colors[type]}; color: white; padding: 10px 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 14px; max-width: 320px; pointer-events: auto; transform: translateX(120%); opacity: 0; transition: transform 0.3s ease, opacity 0.3s ease;`;
        
        toast.innerHTML = `${icons[type]} ${escapeHtml(message)}`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    function showConfirmDialog(title, message) {
        return new Promise((resolve) => resolve(confirm(`${title}\n\n${message}`)));
    }
    
    function openModal() { modal.style.display = 'flex'; }
    function closeModal() { modal.style.display = 'none'; }

    // --- Bookmark Rendering ---

    function createBookmarkCard(bookmark) {
        const card = document.createElement('div');
        card.className = 'bookmark-card';
        card.dataset.id = bookmark.id;

        const fallbackText = createFallbackIconContent(bookmark.title);
        const iconHtml = bookmark.favicon 
            ? `<img src="${escapeHtml(bookmark.favicon)}" alt="图标">` // 使用 API 提供的可靠 favicon 链接
            : `<span>${escapeHtml(fallbackText)}</span>`;

        card.innerHTML = `
            <div class="card-actions">
                <button class="action-btn edit" title="编辑" data-action="edit">✏️</button>
                <button class="action-btn delete" title="删除" data-action="delete">🗑️</button>
            </div>
            <div class="card-header">
                <div class="card-favicon ${!bookmark.favicon ? 'fallback' : ''}">${iconHtml}</div>
                <h3 class="card-title">
                    <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(bookmark.title)}</a>
                </h3>
            </div>
            <div class="card-secondary">${escapeHtml(bookmark.notes || extractDomain(bookmark.url))}</div>
            <div class="card-bottom">
                <div class="bookmark-tags">${(bookmark.tags || []).slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
                <div class="importance-stars">${createStarsHTML(bookmark.importance)}</div>
            </div>
            <div class="card-date">${formatDate(bookmark.dateAdded)}</div>
        `;
        
        const img = card.querySelector('img');
        if (img) {
            img.onerror = () => {
                const faviconContainer = img.closest('.card-favicon');
                if (faviconContainer) {
                    faviconContainer.classList.add('fallback');
                    faviconContainer.innerHTML = `<span>${escapeHtml(fallbackText)}</span>`;
                }
            };
        }
        
        return card;
    }

    function renderBookmarks() {
        grid.innerHTML = '';
        if (currentBookmarks.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            currentBookmarks.sort((a, b) => (b.importance - a.importance) || (new Date(b.dateAdded) - new Date(a.dateAdded)));
            currentBookmarks.forEach(bookmark => grid.appendChild(createBookmarkCard(bookmark)));
        }
    }
    
    // --- Core Application Logic ---

    async function loadAndRenderBookmarks() {
        showLoading();
        try {
            if (typeof bookmarkAPI === 'undefined' || typeof bookmarkAPI.getBookmarks !== 'function') {
                throw new Error('bookmarkAPI or getBookmarks function is not available.');
            }
            allBookmarks = await bookmarkAPI.getBookmarks();
            currentBookmarks = [...allBookmarks];
            renderBookmarks();
        } catch (error) {
            console.error('加载书签失败:', error);
            showToast('加载书签失败: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        const importance = importanceFilter.value;
        
        currentBookmarks = allBookmarks.filter(bookmark => {
            const matchesQuery = !query ||
                (bookmark.title || '').toLowerCase().includes(query) ||
                (bookmark.notes || '').toLowerCase().includes(query) ||
                (bookmark.tags || []).some(tag => tag.toLowerCase().includes(query)) ||
                (bookmark.url || '').toLowerCase().includes(query);
            
            const matchesImportance = !importance || bookmark.importance >= parseInt(importance);
            return matchesQuery && matchesImportance;
        });
        
        renderBookmarks();
    }

    function handleSearchInput() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 300);
    }

    function openAddBookmarkModal() {
        modalTitle.textContent = '✨ 添加新书签';
        bookmarkForm.reset();
        bookmarkForm.removeAttribute('data-edit-id');
        openModal();
        document.getElementById('bookmark-title').focus();
    }
    
    function openEditBookmarkModal(id) {
        const bookmark = allBookmarks.find(b => b.id === id);
        if (!bookmark) return;

        modalTitle.textContent = '✏️ 编辑书签';
        // 【BUG修复】使用 `|| ''` 确保 null/undefined 值不会变成字符串 "null"
        document.getElementById('bookmark-title').value = bookmark.title || '';
        document.getElementById('bookmark-url').value = bookmark.url || '';
        document.getElementById('bookmark-tags').value = (bookmark.tags || []).join(', ');
        document.getElementById('bookmark-notes').value = bookmark.notes || '';
        document.getElementById('bookmark-importance').value = bookmark.importance || 3;
        
        bookmarkForm.setAttribute('data-edit-id', id);
        openModal();
        document.getElementById('bookmark-title').focus();
    }
    
    async function handleDeleteBookmark(id) {
        const bookmark = allBookmarks.find(b => b.id === id);
        if (!bookmark) return;
        
        const confirmed = await showConfirmDialog('确认删除', `确定要删除书签 "${bookmark.title}" 吗？此操作无法撤销。`);
        
        if (confirmed) {
            try {
                await bookmarkAPI.deleteBookmark(id);
                showToast('📚 书签已删除', 'success');
                await loadAndRenderBookmarks();
            } catch (error) {
                console.error('删除书签失败:', error);
                showToast('删除失败: ' + error.message, 'error');
            }
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('bookmark-title').value.trim();
        const url = document.getElementById('bookmark-url').value.trim();
        
        if (!title || !url) return showToast('请填写标题和网址', 'warning');
        try { new URL(url); } catch (err) { return showToast('请输入有效的网址格式', 'warning'); }
        
        const formData = {
            title,
            url,
            tags: document.getElementById('bookmark-tags').value.split(',').map(t => t.trim()).filter(Boolean),
            notes: document.getElementById('bookmark-notes').value.trim(),
            importance: parseInt(document.getElementById('bookmark-importance').value, 10)
        };
        
        const editId = bookmarkForm.getAttribute('data-edit-id');
        
        try {
            if (editId) {
                await bookmarkAPI.updateBookmark({ ...formData, id: editId });
                showToast('📝 书签已更新', 'success');
            } else {
                await bookmarkAPI.addBookmark(formData);
                showToast('✨ 书签已添加', 'success');
            }
            closeModal();
            await loadAndRenderBookmarks();
        } catch (error) {
            console.error('保存书签失败:', error);
            showToast('保存失败: ' + error.message, 'error');
        }
    }

    // --- Event Listeners Setup ---

    searchInput.addEventListener('keyup', handleSearchInput);
    importanceFilter.addEventListener('change', applyFilters);
    addBookmarkBtn.addEventListener('click', openAddBookmarkModal);
    bookmarkForm.addEventListener('submit', handleFormSubmit);
    cancelButton.addEventListener('click', closeModal);

    grid.addEventListener('click', (e) => {
        const target = e.target;
        const actionButton = target.closest('[data-action]');
        
        if (actionButton) {
            e.preventDefault();
            e.stopPropagation();
            const card = actionButton.closest('.bookmark-card');
            if (!card) return;
            const bookmarkId = card.dataset.id;
            const action = actionButton.dataset.action;

            if (action === 'edit') openEditBookmarkModal(bookmarkId);
            else if (action === 'delete') handleDeleteBookmark(bookmarkId);
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display !== 'none') closeModal();
    });

    // --- Initial Load ---
    initToastSystem();
    loadAndRenderBookmarks();
});