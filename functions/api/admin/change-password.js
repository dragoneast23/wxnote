// 管理员修改自己的密码
// POST /api/admin/change-password
// body: { current_password, new_password, confirm_password }
import { parseBody, ok, fail } from '../../_shared/response.js';
import { getAdminByCookie, clearAdminCookie } from '../../_shared/adminAuth.js';
import bcrypt from 'bcryptjs';

export async function onRequestPost({ request, env }) {
  const auth = await getAdminByCookie(request, env.DB);
  if (auth instanceof Response) return auth;

  const { current_password, new_password, confirm_password } = await parseBody(request);
  if (!current_password) return fail('当前密码不能为空');
  if (new_password !== confirm_password) return fail('两次输入的新密码不一致');
  if (!new_password || new_password.length < 8) return fail('新密码长度至少为8位');

  const db = env.DB;
  const admin = await db.prepare(
    'SELECT password_hash FROM registers_admin WHERE id = ?'
  ).bind(auth.admin.id).first();

  const valid = await bcrypt.compare(current_password, admin.password_hash);
  if (!valid) return fail('当前密码不正确');

  const newHash = await bcrypt.hash(new_password, 10);
  await db.prepare(
    'UPDATE registers_admin SET password_hash = ?, updated_at = datetime(\'now\', \'localtime\'), token = NULL, token_expire = NULL WHERE id = ?'
  ).bind(newHash, auth.admin.id).run();

  // 修改密码后自动登出
  const resp = ok('密码修改成功，请使用新密码重新登录');
  return clearAdminCookie(resp);
}
