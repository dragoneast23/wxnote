// 修改密码
// POST /api/change-password
// body: { username, oldPassword, newPassword, confirmPassword }
import { parseBody, ok, fail } from '../_shared/response.js';
import bcrypt from 'bcryptjs';

export async function onRequestPost({ request, env }) {
  const { username, oldPassword, newPassword, confirmPassword } = await parseBody(request);

  if (!username) return fail('账号不能为空');
  if (!oldPassword) return fail('原密码不能为空');
  if (!newPassword) return fail('新密码不能为空');
  if (newPassword !== confirmPassword) return fail('两次输入的新密码不一致');

  const db = env.DB;
  const user = await db.prepare(
    'SELECT id, password FROM users WHERE username = ?'
  ).bind(username).first();

  if (!user) return fail('用户不存在');

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) return fail('原密码不正确');

  const hashedNew = await bcrypt.hash(newPassword, 10);
  await db.prepare('UPDATE users SET password = ? WHERE username = ?').bind(hashedNew, username).run();

  return ok('密码修改成功,即将退出登录');
}
