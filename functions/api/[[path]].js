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
  if (q)  list = list.filter(i => i.title.toLowerCase().includes(q) || i.notes.toLowerCase().includes(q));
  if (tags.length) list = list.filter(i => tags.every(t => i.tags.includes(t)));
  if (imp) list = list.filter(i => i.importance >= imp);
  return jsonResp(list, cors);
}
