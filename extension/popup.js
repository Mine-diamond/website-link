// 默认 API 地址（用户可在设置中修改，保存到 chrome.storage.sync）
const DEFAULT_API_URL = 'https://bookmark.minediamond.tech';

let selectedImportance = 3;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async () => {
  // 1. 获取当前标签页信息
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.title) document.getElementById('title').value = tab.title;
  if (tab?.url) document.getElementById('url').value = tab.url;

  // 2. 加载 API 配置
  const { apiUrl, apiToken } = await chrome.storage.sync.get(['apiUrl', 'apiToken']);
  document.getElementById('apiUrl').value = apiUrl || DEFAULT_API_URL;
  document.getElementById('apiToken').value = apiToken || '';

  // 3. 设置默认星级 (3星)
  updateStars(selectedImportance);

  // 4. 事件绑定
  document.getElementById('apiUrl').addEventListener('change', saveApiUrl);
  document.getElementById('apiToken').addEventListener('change', saveApiToken);

  document.getElementById('stars').addEventListener('click', (e) => {
    const btn = e.target.closest('.star-btn');
    if (!btn) return;
    selectedImportance = parseInt(btn.dataset.value);
    updateStars(selectedImportance);
  });

  document.getElementById('submitBtn').addEventListener('click', handleSubmit);

  document.getElementById('settingsToggle').addEventListener('click', () => {
    document.getElementById('settingsPanel').classList.toggle('open');
  });
});

// ===== 星级渲染 =====
function updateStars(value) {
  document.querySelectorAll('.star-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i < value);
  });
}

// ===== 保存 API 地址 =====
function saveApiUrl() {
  const val = document.getElementById('apiUrl').value.trim();
  chrome.storage.sync.set({ apiUrl: val || DEFAULT_API_URL });
}

function saveApiToken() {
  const val = document.getElementById('apiToken').value.trim();
  chrome.storage.sync.set({ apiToken: val });
}

// ===== 提交 =====
async function handleSubmit() {
  const title = document.getElementById('title').value.trim();
  const url = document.getElementById('url').value.trim();
  const tags = document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const notes = document.getElementById('notes').value.trim();
  const importance = selectedImportance;

  if (!title || !url) {
    showStatus('无法获取页面信息', 'error');
    return;
  }

  const apiUrl = document.getElementById('apiUrl').value.trim() || DEFAULT_API_URL;
  const apiToken = document.getElementById('apiToken').value.trim();
  const endpoint = `${apiUrl.replace(/\/+$/, '')}/api/bookmarks`;
  const headers = { 'Content-Type': 'application/json' };

  if (apiToken) {
    headers.Authorization = `Bearer ${apiToken}`;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = '收藏中...';
  showStatus('正在保存...', 'loading');

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, url, tags, notes, importance })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    showStatus('已收藏！', 'success');
    btn.textContent = '完成';
    setTimeout(() => window.close(), 1200);
  } catch (err) {
    showStatus('收藏失败: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = '收藏';
  }
}

// ===== 状态显示 =====
function showStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status';
  // 强制 reflow 让类名生效
  void el.offsetWidth;
  el.classList.add(type);
}
