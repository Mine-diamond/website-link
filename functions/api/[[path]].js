// functions/api/[[path]].js
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');   // 去掉 /api 前缀
  
  // 通用 CORS 头
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (request.method === 'OPTIONS')
    return new Response(null, { headers: CORS });

  try {
    switch (path) {
      case '/bookmarks':
        if (request.method === 'GET')  return list(env, CORS);
        if (request.method === 'POST') return add(request, env, CORS);
        break;
      case '/bookmarks/update':
        if (request.method === 'POST') return update(request, env, CORS);
        break;
      case '/bookmarks/delete':
        if (request.method === 'POST') return remove(request, env, CORS);
        break;
      case '/bookmarks/search':
        if (request.method === 'GET')  return search(request, env, CORS);
        break;
      case '/bookmarks/ai-query':
        if (request.method === 'POST') return aiQuery(request, env, CORS);
        break;
    }
    return new Response('Not Found', { status: 404, headers: CORS });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
}

// 工具函数们 ─────────────────────────────
const jsonResp = (obj, cors) =>
  new Response(JSON.stringify(obj), { headers: { ...cors, 'Content-Type': 'application/json' } });

const readKV = async (env) => await env.BOOKMARKS_KV.get('bookmarks', 'json') || [];
const writeKV = async (env, data) => env.BOOKMARKS_KV.put('bookmarks', JSON.stringify(data));

const favicon = (u) => {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(u).hostname}&sz=32`; }
  catch { return null; }
};
// CRUD 实现 ──────────────────────────────
async function list(env, cors) {
  return jsonResp(await readKV(env), cors);
}

async function add(req, env, cors) {
  const body = await req.json();
  if (!body.title || !body.url) return jsonResp({ error: 'title & url required' }, cors);
  const all = await readKV(env);
  const item = {
    id: Date.now().toString(),
    title: body.title,
    url: body.url,
    tags: body.tags || [],
    notes: body.notes || '',
    favicon: body.favicon || favicon(body.url),
    importance: body.importance || 1,
    dateAdded: new Date().toISOString()
  };
  all.push(item);
  await writeKV(env, all);
  return jsonResp(item, cors);
}

async function update(req, env, cors) {
  const body = await req.json();
  if (!body.id) return jsonResp({ error: 'id required' }, cors);
  const all = await readKV(env);
  const idx = all.findIndex(i => i.id === body.id);
  if (idx === -1) return jsonResp({ error: 'not found' }, cors);
  all[idx] = { ...all[idx], ...body };
  await writeKV(env, all);
  return jsonResp(all[idx], cors);
}

async function remove(req, env, cors) {
  const { id } = await req.json();
  const all = await readKV(env);
  const newArr = all.filter(i => i.id !== id);
  await writeKV(env, newArr);
  return jsonResp({ success: true }, cors);
}

async function search(req, env, cors) {
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') || '').toLowerCase();
  const tags = u.searchParams.getAll('tags');
  const imp = parseInt(u.searchParams.get('importance') || '0');

  let list = await readKV(env);
  if (q)  list = list.filter(i => i.title.toLowerCase().includes(q) || i.notes.toLowerCase().includes(q) || i.url.toLowerCase().includes(q) || (i.tags || []).some(tag => tag.toLowerCase().includes(q)));
  if (tags.length) list = list.filter(i => tags.every(t => i.tags.includes(t)));
  if (imp) list = list.filter(i => i.importance >= imp);
  return jsonResp(list, cors);
}

// AI 查询 ────────────────────────────
async function aiQuery(req, env, cors) {
  const { query } = await req.json();
  if (!query) return jsonResp({ error: 'query required' }, cors);

  const all = await readKV(env);
  const bookmarksJson = JSON.stringify(all, null, 2);

  // 读取环境变量中的 AI 配置
  const baseUrl = (env.AI_API_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
  const apiKey = env.AI_API_KEY;
  const model = env.AI_MODEL || 'deepseek-chat';

  if (!apiKey) {
    return jsonResp({ error: 'AI_API_KEY not configured' }, cors);
  }

  const systemPrompt = `你是一个书签管理助手。用户有以下书签（JSON格式）：

${bookmarksJson}

用户搜索："${query}"

请完成两个任务：
1. 从用户已有的书签中找出最相关的（标题、标签、备注中匹配），按相关性从高到低排序。如果找不到相关的返回空数组。
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
      return jsonResp({ error: `AI API error: ${aiResp.status} ${errText}` }, cors);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // 尝试解析 AI 返回的 JSON
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // 如果 AI 返回了 markdown 代码块，尝试从中提取 JSON
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    return jsonResp({
      matched: result.matched || [],
      suggestions: result.suggestions || []
    }, cors);
  } catch (e) {
    return jsonResp({ error: `AI query failed: ${e.message}` }, cors);
  }
}
