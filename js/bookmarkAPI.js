// js/bookmarkAPI.js - 前端API调用封装
class BookmarkAPI {
    constructor() {
        // 使用相对路径，自动使用当前域名
        this.baseUrl = '/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // 获取所有书签
    async getBookmarks() {
        return await this.request('/bookmarks');
    }

    // 添加书签
    async addBookmark(bookmark) {
        return await this.request('/bookmarks', {
            method: 'POST',
            body: JSON.stringify(bookmark),
        });
    }

    // 更新书签
    async updateBookmark(bookmark) {
        return await this.request('/bookmarks/update', {
            method: 'POST',
            body: JSON.stringify(bookmark),
        });
    }

    // 删除书签
    async deleteBookmark(id) {
        return await this.request('/bookmarks/delete', {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
    }

    // 搜索书签
    async searchBookmarks(query, tags = [], importance = null) {
        const params = new URLSearchParams();
        
        if (query) params.append('q', query);
        if (tags.length > 0) {
            tags.forEach(tag => params.append('tags', tag));
        }
        if (importance) params.append('importance', importance);
        
        const queryString = params.toString();
        const endpoint = queryString ? `/bookmarks/search?${queryString}` : '/bookmarks/search';
        
        return await this.request(endpoint);
    }
}

// 导出API实例
window.bookmarkAPI = new BookmarkAPI();
