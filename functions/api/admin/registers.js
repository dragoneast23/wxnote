// 注册码管理
// GET    /api/admin/registers                → 列表
// POST   /api/admin/registers                → 批量生成  body: { count }
// DELETE /api/admin/registers                → 批量删除  body: { codes: [...] }
// DELETE /api/admin/registers?code=xxx       → 删除单个
import { parseBody, ok, fail, getQuery } from '../../_shared/response.js';
import { getAdminByCookie } from '../../_shared/adminAuth.js';
import { generateRegisterCode } from '../../_shared/db.js';

// GET 列表
export async function onRequestGet({ request, env }) {
  const auth = await getAdminByCookie(request, env.DB);
  if (auth instanceof Response) return auth;

  const { results } = await env.DB.prepare(
    'SELECT registercode FROM registers ORDER BY registercode'
  ).all();
  return ok('success', (results || []).map(r => r.registercode));
}

// POST 批量生成
export async function onRequestPost({ request, env }) {
  const auth = await getAdminByCookie(request, env.DB);
  if (auth instanceof Response) return auth;

  const { count } = await parseBody(request);
  let n = parseInt(count, 10);
  if (!n || n < 1) n = 10;
  if (n > 100) n = 100;

  const stmt = env.DB.prepare('INSERT INTO registers (registercode) VALUES (?)');
  const generated = [];
  for (let i = 0; i < n; i++) {
    const len = 8 + Math.floor(Math.random() * 9); // 8-16位
    const code = generateRegisterCode(len);
    await stmt.bind(code).run();
    generated.push(code);
  }
  return ok('生成成功', { count: generated.length, codes: generated });
}

// DELETE 删除（单个或批量）
export async function onRequestDelete({ request, env }) {
  const auth = await getAdminByCookie(request, env.DB);
  if (auth instanceof Response) return auth;

  // 优先看 query
  const { code } = getQuery(request);
  if (code) {
    await env.DB.prepare('DELETE FROM registers WHERE registercode = ?').bind(code).run();
    return ok('删除成功');
  }

  // 否则看 body
  const { codes } = await parseBody(request);
  if (!Array.isArray(codes) || codes.length === 0) return fail('未指定要删除的注册码');

  const stmt = env.DB.prepare('DELETE FROM registers WHERE registercode = ?');
  for (const c of codes) {
    await stmt.bind(c).run();
  }
  return ok('删除成功', { count: codes.length });
}
