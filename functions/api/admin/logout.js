// 管理员退出
// POST /api/admin/logout
import { ok } from '../../_shared/response.js';
import { getAdminByCookie, clearAdminCookie } from '../../_shared/adminAuth.js';

export async function onRequestPost({ request, env }) {
  const auth = await getAdminByCookie(request, env.DB);
  if (!(auth instanceof Response)) {
    // 清除 token
    await env.DB.prepare(
      'UPDATE registers_admin SET token = NULL, token_expire = NULL WHERE id = ?'
    ).bind(auth.admin.id).run();
  }
  const resp = ok('退出成功');
  return clearAdminCookie(resp);
}
