// js/bookmarks.js - 收藏夹页面逻辑（重构优化版）

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

    if (!grid || !emptyState || !loadingIndicator || !modal || !bookmarkForm) {
        console.error("关键UI元素缺失，脚本无法正常运行。");
        return;
    }

    // --- Helper Functions ---

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url;
        }
    }
    
    function formatDate(dateString) {
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
    }

    function createFallbackIconContent(title) {
        return title.charAt(0).toUpperCase();
    }
    
    function createStarsHTML(importance) {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<span class="star ${i <= importance ? '' : 'empty'}">★</span>`;
        }
        return starsHTML;
    }

    // --- UI Utility Functions ---

    function showLoading() { loadingIndicator.style.display = 'flex'; }
    function hideLoading() { loadingIndicator.style.display = 'none'; }
    
    function initToastSystem() { /* ... (代码与原来一致) ... */ }
    function showToast(message, type = 'info') { /* ... (代码与原来一致) ... */ }
    
    function showConfirmDialog(title, message) {
        return new Promise((resolve) => resolve(confirm(`${title}\n\n${message}`)));
    }
    
    function openModal() { modal.style.display = 'flex'; }
    function closeModal() { modal.style.display = 'none'; }

    // --- Bookmark Rendering ---

    function createBookmarkCard(bookmark) {
        const stars = createStarsHTML(bookmark.importance);
        const tags = bookmark.tags.slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
        const domain = extractDomain(bookmark.url);
        const secondaryInfo = bookmark.notes || domain;
        const dateText = formatDate(bookmark.dateAdded);
        const fallbackText = createFallbackIconContent(bookmark.title);
        
        const card = document.createElement('div');
        card.className = 'bookmark-card';
        card.dataset.id = bookmark.id;
        
        card.innerHTML = `
            <div class="card-actions">
                <button class="action-btn edit" title="编辑" data-action="edit">✏️</button>
                <button class="action-btn delete" title="删除" data-action="delete">🗑️</button>
            </div>
            <div class="card-header">
                <div class="card-favicon ${bookmark.favicon ? '' : 'fallback'}">
                    ${bookmark.favicon 
                        ? `<img src="${escapeHtml(bookmark.favicon)}" alt="图标">`
                        : `<span>${escapeHtml(fallbackText)}</span>`
                    }
                </div>
                <h3 class="card-title">
                    <a href="${escapeHtml(bookmark.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(bookmark.title)}</a>
                </h3>
            </div>
            <div class="card-secondary">${escapeHtml(secondaryInfo)}</div>
            <div class="card-bottom">
                <div class="bookmark-tags">${tags}</div>
                <div class="importance-stars">${stars}</div>
            </div>
            <div class="card-date">${dateText}</div>
        `;
        
        // 【安全修复】使用JS处理图片加载失败事件，而不是不安全的 onerror 属性
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
        if (currentBookmarks.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            
            currentBookmarks.sort((a, b) => {
                if (a.importance !== b.importance) return b.importance - a.importance;
                return new Date(b.dateAdded) - new Date(a.dateAdded);
            });
            
            grid.innerHTML = ''; // Clear previous content
            currentBookmarks.forEach(bookmark => {
                grid.appendChild(createBookmarkCard(bookmark));
            });
        }
    }
    
    // --- Core Application Logic ---

    async function loadAndRenderBookmarks() {
        showLoading();
        try {
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
                (bookmark.title && bookmark.title.toLowerCase().includes(query)) ||
                (bookmark.notes && bookmark.notes.toLowerCase().includes(query)) ||
                (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(query))) ||
                (bookmark.url && bookmark.url.toLowerCase().includes(query));
            
            const matchesImportance = !importance || bookmark.importance >= parseInt(importance);
            
            return matchesQuery && matchesImportance;
        });
        
        renderBookmarks();
        
        if (query && currentBookmarks.length === 0) {
            showToast(`没有找到包含"${query}"的书签`, 'info');
        }
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
        setTimeout(() => document.getElementById('bookmark-title').focus(), 100);
    }
    
    function openEditBookmarkModal(id) {
        const bookmark = allBookmarks.find(b => b.id === id);
        if (!bookmark) return;

        modalTitle.textContent = '✏️ 编辑书签';
        document.getElementById('bookmark-title').value = bookmark.title;
        document.getElementById('bookmark-url').value = bookmark.url;
        document.getElementById('bookmark-tags').value = bookmark.tags.join(', ');
        document.getElementById('bookmark-notes').value = bookmark.notes;
        document.getElementById('bookmark-importance').value = bookmark.importance;
        
        bookmarkForm.setAttribute('data-edit-id', id);
        openModal();
        setTimeout(() => document.getElementById('bookmark-title').focus(), 100);
    }
    
    async function handleDeleteBookmark(id) {
        const bookmark = allBookmarks.find(b => b.id === id);
        if (!bookmark) return;
        
        const confirmed = await showConfirmDialog('确认删除', `确定要删除书签"${bookmark.title}"吗？此操作无法撤销。`);
        
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
        
        if (!title || !url) {
            return showToast('请填写标题和网址', 'warning');
        }
        
        try {
            new URL(url);
        } catch (err) {
            return showToast('请输入有效的网址格式', 'warning');
        }
        
        const formData = {
            title: title,
            url: url,
            tags: document.getElementById('bookmark-tags').value.split(',').map(t => t.trim()).filter(Boolean),
            notes: document.getElementById('bookmark-notes').value.trim(),
            importance: parseInt(document.getElementById('bookmark-importance').value)
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

    // 【重构】使用 addEventListener 替代内联事件处理器
    searchInput.addEventListener('keyup', handleSearchInput);
    importanceFilter.addEventListener('change', applyFilters);
    addBookmarkBtn.addEventListener('click', openAddBookmarkModal);
    bookmarkForm.addEventListener('submit', handleFormSubmit);
    cancelButton.addEventListener('click', closeModal);

    // 【重构】使用事件委托处理动态生成的卡片上的事件
    grid.addEventListener('click', (e) => {
        const target = e.target;
        const actionButton = target.closest('[data-action]');
        
        if (actionButton) {
            e.preventDefault(); // 阻止点击按钮时触发卡片链接跳转
            e.stopPropagation();
            
            const card = actionButton.closest('.bookmark-card');
            const bookmarkId = card.dataset.id;
            const action = actionButton.dataset.action;

            if (action === 'edit') {
                openEditBookmarkModal(bookmarkId);
            } else if (action === 'delete') {
                handleDeleteBookmark(bookmarkId);
            }
        } else if (target.closest('a')) {
            // 如果点击的是链接本身，让默认行为发生
            return;
        } else {
            // 点击卡片其他区域，触发链接点击
            const link = target.closest('.bookmark-card')?.querySelector('.card-title a');
            if (link) {
                link.click();
            }
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display !== 'none') {
            closeModal();
        }
    });

    // --- Initial Load ---
    initToastSystem();
    loadAndRenderBookmarks();
});