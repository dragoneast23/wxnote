// 重置用户密码（管理后台用）
// POST /api/admin/reset-password
// body: { username, admin_password }
//
// 重置后密码统一为 env.RESET_DEFAULT_PASSWORD（默认 12345678）
// 原 PHP 版本会再校验一次管理员密码，这里也保留：要求请求体带 admin_password
import { parseBody, ok, fail } from '../../_shared/response.js';
import { getAdminByCookie } from '../../_shared/adminAuth.js';
import bcrypt from 'bcryptjs';

export async function onRequestPost({ request, env }) {
  const auth = await getAdminByCookie(request, env.DB);
  if (auth instanceof Response) return auth;

  const { username, admin_password } = await parseBody(request);
  if (!username || !username.trim()) return fail('账号为空，禁止重置');

  // 二次校验管理员密码（与原 PHP 一致）
  if (!admin_password) return fail('管理员密码校验失败，禁止重置');

  const db = env.DB;
  const admin = await db.prepare(
    'SELECT password_hash FROM registers_admin WHERE id = ?'
  ).bind(auth.admin.id).first();

  const valid = await bcrypt.compare(admin_password, admin.password_hash);
  if (!valid) return fail('管理员密码校验失败，禁止重置');

  const target = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (!target) return fail('用户不存在');

  const newPwd = env.RESET_DEFAULT_PASSWORD || '12345678';
  const newHash = await bcrypt.hash(newPwd, 10);
  await db.prepare('UPDATE users SET password = ? WHERE username = ?').bind(newHash, username).run();

  return ok('重置成功', { username, newPassword: newPwd });
}
