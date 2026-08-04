// 账号密码注册
// POST /api/register
// body: { username, password, registercode }
import { parseBody, ok, fail } from '../_shared/response.js';
import { nowString } from '../_shared/db.js';
import bcrypt from 'bcryptjs';

export async function onRequestPost({ request, env }) {
  const { username, password, registercode } = await parseBody(request);

  if (!username) return fail('账号不能为空');
  if (!password) return fail('密码不能为空');
  if (!registercode) return fail('注册码不能为空');

  const db = env.DB;

  // 检查账号是否已存在
  const exist = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (exist) return fail('账号已存在');

  // 校验注册码
  const codeRow = await db.prepare('SELECT id FROM registers WHERE registercode = ?').bind(registercode).first();
  if (!codeRow) return fail('注册码不正确');

  // 加密密码（bcrypt，与 PHP password_hash 兼容）
  const hashedPassword = await bcrypt.hash(password, 10);

  // 插入用户（用上海时区时间）
  const result = await db.prepare(
    `INSERT INTO users (username, password, nickname, register_time)
     VALUES (?, ?, ?, ?)`
  ).bind(username, hashedPassword, username, nowString()).run();

  const userId = result.meta.last_row_id;

  // 删除用过的注册码
  await db.prepare('DELETE FROM registers WHERE registercode = ?').bind(registercode).run();

  return ok('注册成功', { id: userId, username });
}
