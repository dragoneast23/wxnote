// 退出登录
// POST /api/logout
// header: token
import { ok } from '../_shared/response.js';

export async function onRequestPost({ request, env }) {
  const token = request.headers.get('token') || '';
  if (token) {
    await env.DB.prepare(
      'UPDATE users SET token = NULL, token_expire = NULL WHERE token = ?'
    ).bind(token).run();
  }
  return ok('退出成功');
}
