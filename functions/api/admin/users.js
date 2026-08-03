// 用户列表（管理后台用）
// GET /api/admin/users
import { ok } from '../../_shared/response.js';
import { getAdminByCookie } from '../../_shared/adminAuth.js';

export async function onRequestGet({ request, env }) {
  const auth = await getAdminByCookie(request, env.DB);
  if (auth instanceof Response) return auth;

  const { results } = await env.DB.prepare(
    `SELECT id, username, nickname, register_time
     FROM users
     ORDER BY id DESC`
  ).all();

  return ok('success', results || []);
}
