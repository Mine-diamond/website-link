const appConfig = {
    groups: [
        {
            title: 'AI 服务',
            items: [
                { label: 'webUI AI服务入口', url: 'http://mineyyming.tech:3000', badge: '外网' },
                { label: 'webUI AI服务入口', url: 'http://192.168.110.229:3000', badge: '内网' },
                { label: 'webUI AI服务入口', url: 'http://localhost:3000', badge: '本机' },
                { label: 'DeepSeek开放平台', url: 'https://platform.deepseek.com/' },
                { label: 'DeepSeek', url: 'https://chat.deepseek.com/', badge: '网页' },
                { label: 'chatGPT', url: 'https://chatGPT.com/', badge: '网页' },
                { label: 'Gemini', url: 'https://gemini.google.com/app', badge: '网页' },
                { label: 'Gemini', url: 'https://aistudio.google.com/app/apikey?hl=zh-cn', badge: '密钥api' },
                { label: 'Gemini', url: 'https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics?project=gen-lang-client-0843974581', badge: '流量数据' },
                { label: '云雾api中转站', url: 'https://yunwu.ai/token', badge: '密钥api' }
            ]
        },
        {
            title: '文件服务',
            items: [
                { label: '文件下载', url: 'http://mineyyming.tech:8000/file.html', badge: '外网' },
                { label: '文件下载', url: 'http://192.168.110.229:8000/file.html', badge: '内网' }
            ]
        },
        {
            title: '我的账号',
            items: [
                { label: 'GitHub 主页', url: 'https://github.com/Mine-diamond/' },
                { label: 'Bilibili主页', url: 'https://space.bilibili.com/3546700379589333/' }
            ]
        },
        {
            title: '我的项目',
            items: [
                { label: 'pet fight game', url: 'https://github.com/Mine-diamond/petFightGame' },
                { label: 'RHyardQuickOperation', url: 'https://github.com/Mine-diamond/RHyardQuickOperation' }
            ]
        },
        {
            title: '其他服务',
            items: [
                { label: 'Mine WP（已弃用）', url: 'http://localhost:8881/', badge: '已弃用' },
                { label: 'Outlook邮箱', url: 'https://outlook.live.com/', badge: 'mine_yaoym@outlook.com' },
                { label: 'Java学习视频', url: 'https://www.bilibili.com/video/BV1Fv4y1q7ZH' },
            ]
        }
    ]
};
