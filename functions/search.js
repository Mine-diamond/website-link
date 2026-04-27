// functions/search.js — 处理 /search?q=xxx 路由
// 读取静态 index.html，注入搜索参数，让前端自动执行搜索
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';

  try {
    // 从静态资源中获取 index.html
    const assetUrl = new URL(request.url);
    assetUrl.pathname = '/index.html';
    const assetReq = new Request(assetUrl, request);
    const res = await env.ASSETS.fetch(assetReq);

    if (!res.ok) return res;

    const html = await res.text();

    // 把搜索词注入到 <head> 中
    const injected = html.replace(
      '</head>',
      `<script>window.__INITIAL_SEARCH__ = ${JSON.stringify(q)};</script></head>`
    );

    return new Response(injected, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (e) {
    return new Response(`Search error: ${e.message}`, { status: 500 });
  }
}
