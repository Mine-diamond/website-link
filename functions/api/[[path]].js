// functions/api/[[path]].js

const BOOKMARKS_KEY = 'bookmarks';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '') || '/';

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const authError = authorize(request, env);
    if (authError) return authError;

    switch (path) {
      case '/bookmarks':
        if (request.method === 'GET') return list(env);
        if (request.method === 'POST') return add(request, env);
        return methodNotAllowed('GET, POST');
      case '/bookmarks/update':
        if (request.method === 'POST') return update(request, env);
        return methodNotAllowed('POST');
      case '/bookmarks/delete':
        if (request.method === 'POST') return remove(request, env);
        return methodNotAllowed('POST');
      case '/bookmarks/search':
        if (request.method === 'GET') return search(request, env);
        return methodNotAllowed('GET');
      case '/bookmarks/ai-query':
        if (request.method === 'POST') return aiQuery(request, env);
        return methodNotAllowed('POST');
      default:
        return errorResp('Not Found', 404);
    }
  } catch (error) {
    console.error(error);
    if (error instanceof HttpError) {
      return errorResp(error.message, error.status);
    }
    return errorResp(error.message || 'Internal Server Error', 500);
  }
}

function authorize(request, env) {
  const token = env.BOOKMARK_API_TOKEN;
  if (!token) return null;

  const authorization = request.headers.get('Authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) return errorResp('Authorization bearer token required', 401);
  if (match[1] !== token) return errorResp('Invalid authorization token', 403);
  return null;
}

function jsonResp(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, ...extraHeaders, 'Content-Type': 'application/json' }
  });
}

function errorResp(message, status = 400, extraHeaders = {}) {
  return jsonResp({ error: message }, status, extraHeaders);
}

function methodNotAllowed(allow) {
  return errorResp('Method Not Allowed', 405, { Allow: allow });
}

async function readJson(req) {
  try {
    return await req.json();
  } catch {
    throw new HttpError('Invalid JSON request body', 400);
  }
}

class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const readKV = async (env) => {
  const value = await env.BOOKMARKS_KV.get(BOOKMARKS_KEY, 'json');
  return Array.isArray(value) ? value.map(normalizeStoredBookmark).filter(Boolean) : [];
};

const writeKV = async (env, data) => env.BOOKMARKS_KV.put(BOOKMARKS_KEY, JSON.stringify(data));

function favicon(url) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;
  } catch {
    return null;
  }
}

function normalizeStoredBookmark(value) {
  if (!value || typeof value !== 'object') return null;

  const id = typeof value.id === 'string' ? value.id : '';
  const title = typeof value.title === 'string' ? value.title : '';
  const url = typeof value.url === 'string' ? value.url : '';
  if (!id || !title || !url) return null;

  const dateAdded = typeof value.dateAdded === 'string' ? value.dateAdded : new Date(0).toISOString();

  return {
    id,
    title,
    url,
    tags: Array.isArray(value.tags) ? value.tags.filter((tag) => typeof tag === 'string') : [],
    notes: typeof value.notes === 'string' ? value.notes : '',
    favicon: typeof value.favicon === 'string' ? value.favicon : null,
    importance: normalizeStoredImportance(value.importance),
    dateAdded,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : dateAdded
  };
}

function normalizeStoredImportance(value) {
  const importance = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(importance)) return 1;
  return Math.max(1, Math.min(5, Math.round(importance)));
}

function validateBookmarkInput(body, existing = null) {
  if (!body || typeof body !== 'object') {
    throw new HttpError('Request body must be an object', 400);
  }

  const next = {};

  if (!existing || Object.prototype.hasOwnProperty.call(body, 'title')) {
    if (typeof body.title !== 'string') throw new HttpError('title is required', 400);
    next.title = body.title.trim();
    if (!next.title) throw new HttpError('title is required', 400);
    if (next.title.length > 200) throw new HttpError('title is too long', 400);
  }

  if (!existing || Object.prototype.hasOwnProperty.call(body, 'url')) {
    if (typeof body.url !== 'string') throw new HttpError('url is required', 400);
    next.url = body.url.trim();
    validateHttpUrl(next.url, 'url');
  }

  if (!existing || Object.prototype.hasOwnProperty.call(body, 'tags')) {
    if (typeof body.tags === 'undefined') {
      next.tags = [];
    } else if (!Array.isArray(body.tags)) {
      throw new HttpError('tags must be an array', 400);
    } else {
      const tags = body.tags.map((tag) => {
        if (typeof tag !== 'string') throw new HttpError('tags must contain only strings', 400);
        return tag.trim();
      }).filter(Boolean);
      const uniqueTags = [...new Set(tags)];
      if (uniqueTags.length > 30) throw new HttpError('too many tags', 400);
      if (uniqueTags.some((tag) => tag.length > 64)) throw new HttpError('tag is too long', 400);
      next.tags = uniqueTags;
    }
  }

  if (!existing || Object.prototype.hasOwnProperty.call(body, 'notes')) {
    if (typeof body.notes === 'undefined') {
      next.notes = '';
    } else if (typeof body.notes !== 'string') {
      throw new HttpError('notes must be a string', 400);
    } else {
      next.notes = body.notes.trim();
      if (next.notes.length > 2000) throw new HttpError('notes is too long', 400);
    }
  }

  if (!existing || Object.prototype.hasOwnProperty.call(body, 'importance')) {
    if (typeof body.importance === 'undefined') {
      next.importance = 1;
    } else {
      const importance = Number(body.importance);
      if (!Number.isInteger(importance) || importance < 1 || importance > 5) {
        throw new HttpError('importance must be an integer from 1 to 5', 400);
      }
      next.importance = importance;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'favicon')) {
    if (body.favicon === null || body.favicon === '') {
      next.favicon = null;
    } else if (typeof body.favicon !== 'string') {
      throw new HttpError('favicon must be a URL string or null', 400);
    } else {
      validateHttpUrl(body.favicon, 'favicon');
      next.favicon = body.favicon;
    }
  }

  return next;
}

function validateHttpUrl(value, field) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }
  } catch {
    throw new HttpError(`${field} must be a valid http or https URL`, 400);
  }
}

async function list(env) {
  return jsonResp(await readKV(env));
}

async function add(req, env) {
  const body = await readJson(req);
  const input = validateBookmarkInput(body);
  const all = await readKV(env);
  const now = new Date().toISOString();
  const item = {
    id: crypto.randomUUID(),
    title: input.title,
    url: input.url,
    tags: input.tags,
    notes: input.notes,
    favicon: Object.prototype.hasOwnProperty.call(input, 'favicon') ? input.favicon : favicon(input.url),
    importance: input.importance,
    dateAdded: now,
    updatedAt: now
  };

  all.push(item);
  await writeKV(env, all);
  return jsonResp(item, 201);
}

async function update(req, env) {
  const body = await readJson(req);
  if (!body || typeof body !== 'object' || typeof body.id !== 'string' || !body.id.trim()) {
    return errorResp('id required', 400);
  }

  const all = await readKV(env);
  const idx = all.findIndex((item) => item.id === body.id);
  if (idx === -1) return errorResp('not found', 404);

  const existing = all[idx];
  const input = validateBookmarkInput(body, existing);
  const nextUrl = Object.prototype.hasOwnProperty.call(input, 'url') ? input.url : existing.url;
  const hasExplicitFavicon = Object.prototype.hasOwnProperty.call(input, 'favicon');
  const urlChanged = nextUrl !== existing.url;
  const now = new Date().toISOString();

  all[idx] = {
    ...existing,
    ...input,
    url: nextUrl,
    favicon: hasExplicitFavicon ? input.favicon : (urlChanged ? favicon(nextUrl) : existing.favicon),
    updatedAt: now
  };

  await writeKV(env, all);
  return jsonResp(all[idx]);
}

async function remove(req, env) {
  const body = await readJson(req);
  const id = body && typeof body.id === 'string' ? body.id : '';
  if (!id.trim()) return errorResp('id required', 400);

  const all = await readKV(env);
  const exists = all.some((item) => item.id === id);
  if (!exists) return errorResp('not found', 404);

  await writeKV(env, all.filter((item) => item.id !== id));
  return jsonResp({ success: true });
}

async function search(req, env) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const tags = url.searchParams.getAll('tags').map((tag) => tag.trim()).filter(Boolean);
  const importanceParam = url.searchParams.get('importance');
  const importance = importanceParam ? Number(importanceParam) : 0;

  if (importanceParam && (!Number.isInteger(importance) || importance < 1 || importance > 5)) {
    return errorResp('importance must be an integer from 1 to 5', 400);
  }

  let bookmarks = await readKV(env);

  if (q) {
    bookmarks = bookmarks.filter((item) => {
      const haystack = [item.title, item.notes, item.url, ...(item.tags || [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  if (tags.length) {
    bookmarks = bookmarks.filter((item) => tags.every((tag) => item.tags.includes(tag)));
  }

  if (importance) {
    bookmarks = bookmarks.filter((item) => item.importance >= importance);
  }

  return jsonResp(bookmarks);
}

async function aiQuery(req, env) {
  const body = await readJson(req);
  const query = body && typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) return errorResp('query required', 400);
  if (query.length > 500) return errorResp('query is too long', 400);

  const all = await readKV(env);
  const bookmarksForPrompt = all.map(({ id, title, url, tags, notes, importance }) => ({ id, title, url, tags, notes, importance }));

  const baseUrl = (env.AI_API_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
  const apiKey = env.AI_API_KEY;
  const model = env.AI_MODEL || 'deepseek-chat';

  if (!apiKey) {
    return errorResp('AI_API_KEY not configured', 503);
  }

  const systemPrompt = `你是一个书签管理助手。用户有以下书签（JSON格式）：

${JSON.stringify(bookmarksForPrompt, null, 2)}

用户搜索："${query}"

请完成两个任务：
1. 从用户已有的书签中找出最相关的（标题、URL、标签、备注中匹配），按相关性从高到低排序。如果找不到相关的返回空数组。
2. 如果用户可能对其他有用的网站感兴趣，推荐 1-3 个新网站。只推荐你确定存在且高质量的网站，不要编造URL。如果找不到值得推荐的，返回空数组。

请严格按以下 JSON 格式回复（不要包含 markdown 代码块标记，只返回纯 JSON）：
{
  "matched": [
    { "id": "书签的id", "reason": "匹配理由（一句话）" }
  ],
  "suggestions": [
    { "title": "网站标题", "url": "https://...", "description": "简要描述", "reason": "推荐理由（特点）" }
  ]
}

注意：matched 中的 id 必须与上面数据中的 id 完全一致。如果用户搜索的是已有书签中明确存在的，matched 应该优先匹配。`;

  try {
    const aiResp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
        max_tokens: 4096
      })
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      return errorResp(`AI API error: ${aiResp.status} ${errText}`, 502);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    const parsed = parseAiJson(content);
    const existingIds = new Set(all.map((bookmark) => bookmark.id));

    return jsonResp({
      matched: (Array.isArray(parsed.matched) ? parsed.matched : [])
        .filter((match) => match && existingIds.has(match.id))
        .map((match) => ({ id: match.id, reason: typeof match.reason === 'string' ? match.reason : '' })),
      suggestions: (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
        .filter((suggestion) => suggestion && typeof suggestion.title === 'string' && typeof suggestion.url === 'string')
        .slice(0, 3)
        .map((suggestion) => ({
          title: suggestion.title,
          url: suggestion.url,
          description: typeof suggestion.description === 'string' ? suggestion.description : '',
          reason: typeof suggestion.reason === 'string' ? suggestion.reason : ''
        }))
    });
  } catch (error) {
    return errorResp(`AI query failed: ${error.message}`, 502);
  }
}

function parseAiJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]);
    throw new Error('Failed to parse AI response as JSON');
  }
}
