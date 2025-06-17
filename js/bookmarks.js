// js/bookmarks.js - 收藏夹页面逻辑

let allBookmarks = [];
let currentBookmarks = [];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadBookmarks();
});

// 加载书签
async function loadBookmarks() {
    showLoading();
    try {
        allBookmarks = await bookmarkAPI.getBookmarks();
        currentBookmarks = [...allBookmarks];
        renderBookmarks();
    } catch (error) {
        console.error('加载书签失败:', error);
        showError('加载书签失败: ' + error.message);
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
            return b.importance - a.importance; // 重要程度高的在前
        }
        return new Date(b.dateAdded) - new Date(a.dateAdded); // 新的在前
    });
    
    grid.innerHTML = currentBookmarks.map(bookmark => createBookmarkCard(bookmark)).join('');
}

// 创建书签卡片HTML
function createBookmarkCard(bookmark) {
    const stars = '★'.repeat(bookmark.importance) + '☆'.repeat(5 - bookmark.importance);
    const tags = bookmark.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    return `
        <div class="card bookmark-card" data-id="${bookmark.id}">
            <div class="card-actions">
                <button onclick="editBookmark('${bookmark.id}')" title="编辑">✏️</button>
                <button onclick="deleteBookmark('${bookmark.id}')" title="删除">🗑️</button>
            </div>
            
            <div class="card-icon">
                <img src="${bookmark.favicon || '/favicon.ico'}" alt="图标" onerror="this.src='/favicon.ico'">
            </div>
            
            <div class="card-content">
                <h3 class="card-title">
                    <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer">
                        ${bookmark.title}
                    </a>
                </h3>
                
                ${bookmark.notes ? `<p class="card-description">${bookmark.notes}</p>` : ''}
                
                <div class="importance-stars">${stars}</div>
                
                ${tags ? `<div class="bookmark-tags">${tags}</div>` : ''}
                
                <div class="card-meta">
                    <small>添加于 ${formatDate(bookmark.dateAdded)}</small>
                </div>
            </div>
        </div>
    `;
}

// 时间格式化
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

// 搜索书签
async function searchBookmarks() {
    const query = document.getElementById('search-input').value;
    const importance = document.getElementById('importance-filter').value;
    
    if (!query && !importance) {
        currentBookmarks = [...allBookmarks];
    } else {
        currentBookmarks = allBookmarks.filter(bookmark => {
            const matchesQuery = !query || 
                bookmark.title.toLowerCase().includes(query.toLowerCase()) ||
                bookmark.notes.toLowerCase().includes(query.toLowerCase()) ||
                bookmark.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
            
            const matchesImportance = !importance || bookmark.importance >= parseInt(importance);
            
            return matchesQuery && matchesImportance;
        });
    }
    
    renderBookmarks();
}

// 重要程度过滤
function filterBookmarks() {
    searchBookmarks();
}

// 打开添加书签模态框
function openAddBookmarkModal() {
    document.getElementById('modal-title').textContent = '添加书签';
    document.getElementById('bookmark-form').reset();
    document.getElementById('bookmark-form').removeAttribute('data-edit-id');
    document.getElementById('bookmark-modal').style.display = 'flex';
}

// 关闭模态框
function closeBookmarkModal() {
    document.getElementById('bookmark-modal').style.display = 'none';
}

// 编辑书签
function editBookmark(id) {
    const bookmark = allBookmarks.find(b => b.id === id);
    if (!bookmark) return;
    
    document.getElementById('modal-title').textContent = '编辑书签';
    document.getElementById('bookmark-title').value = bookmark.title;
    document.getElementById('bookmark-url').value = bookmark.url;
    document.getElementById('bookmark-tags').value = bookmark.tags.join(', ');
    document.getElementById('bookmark-notes').value = bookmark.notes;
    document.getElementById('bookmark-importance').value = bookmark.importance;
    
    document.getElementById('bookmark-form').setAttribute('data-edit-id', id);
    document.getElementById('bookmark-modal').style.display = 'flex';
}

// 删除书签
async function deleteBookmark(id) {
    if (!confirm('确定要删除这个书签吗？')) return;
    
    try {
        await bookmarkAPI.deleteBookmark(id);
        await loadBookmarks();
        showSuccess('书签已删除');
    } catch (error) {
        console.error('删除书签失败:', error);
        showError('删除失败: ' + error.message);
    }
}

// 处理表单提交
document.getElementById('bookmark-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('bookmark-title').value,
        url: document.getElementById('bookmark-url').value,
        tags: document.getElementById('bookmark-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag),
        notes: document.getElementById('bookmark-notes').value,
        importance: parseInt(document.getElementById('bookmark-importance').value)
    };
    
    const editId = this.getAttribute('data-edit-id');
    
    try {
        if (editId) {
            // 编辑
            await bookmarkAPI.updateBookmark({ ...formData, id: editId });
            showSuccess('书签已更新');
        } else {
            // 添加
            await bookmarkAPI.addBookmark(formData);
            showSuccess('书签已添加');
        }
        
        closeBookmarkModal();
        await loadBookmarks();
    } catch (error) {
        console.error('保存书签失败:', error);
        showError('保存失败: ' + error.message);
    }
});

// 点击模态框外部关闭
document.getElementById('bookmark-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeBookmarkModal();
    }
});

// 工具函数
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showSuccess(message) {
    // 简单的成功提示，你可以用更好看的组件
    alert(message);
}

function showError(message) {
    // 简单的错误提示，你可以用更好看的组件
    alert(message);
}
