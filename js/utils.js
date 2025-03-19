// 统一的工具函数
const Utils = {
    // 将文本转换为URL友好的格式（用于ID）
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
};
