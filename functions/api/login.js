// 账号密码登录
// POST /api/login
// body: { username, password }
import { parseBody, ok, fail } from '../_shared/response.js';
import { generateToken, tokenExpireString } from '../_shared/auth.js';
import bcrypt from 'bcryptjs';

export async function onRequestPost({ request, env }) {
  const { username, password } = await parseBody(request);

  if (!username) return fail('账号不能为空');
  if (!password) return fail('密码不能为空');

  const db = env.DB;
  const user = await db.prepare(
    'SELECT id, username, password, nickname, register_time FROM users WHERE username = ?'
  ).bind(username).first();

  if (!user) return fail('账号不存在');

  // 验证密码（兼容 PHP 的 $2y$ 哈希：bcryptjs 默认用 $2a$/$2b$，但能验证 $2y$）
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return fail('密码错误');

  // 生成并保存 token
  const token = generateToken(user.username);
  const expire = tokenExpireString();
  await db.prepare(
    'UPDATE users SET token = ?, token_expire = ? WHERE id = ?'
  ).bind(token, expire, user.id).run();

  return ok('登录成功', {
    id: user.id,
    username: user.username,
    nickname: user.nickname || '',
    register_time: user.register_time,
    token,
  });
}
