// js/bookmarkAPI.js - 前端API调用封装
class BookmarkAPI {
    constructor() {
        // 使用相对路径，自动使用当前域名
        this.baseUrl = '/api';
        this.tokenKey = 'bookmark-api-token';
    }

    async request(endpoint, options = {}, hasRetriedAuth = false) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };
        const token = localStorage.getItem(this.tokenKey);

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);
            const data = await this.readJson(response);

            if ((response.status === 401 || response.status === 403) && !hasRetriedAuth) {
                const nextToken = window.prompt('请输入 Bookmark API Token');
                if (nextToken && nextToken.trim()) {
                    localStorage.setItem(this.tokenKey, nextToken.trim());
                    return await this.request(endpoint, options, true);
                }
            }

            if (!response.ok) {
                throw new Error(data?.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async readJson(response) {
        try {
            return await response.json();
        } catch (error) {
            return null;
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

    // AI 智能搜索
    async aiQuery(query) {
        return await this.request('/bookmarks/ai-query', {
            method: 'POST',
            body: JSON.stringify({ query }),
        });
    }
}

// 导出API实例
window.bookmarkAPI = new BookmarkAPI();
var bookmarkAPI = new BookmarkAPI();
