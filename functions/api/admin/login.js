// 管理员登录
// POST /api/admin/login
// body: { username, password }
//
// 初始化逻辑：若 registers_admin 中 along 的 password_hash 仍是 'INIT_PLACEHOLDER'，
// 用 env.ADMIN_DEFAULT_PASSWORD 生成真实 bcrypt 哈希并写入。
import { parseBody, ok, fail } from '../../_shared/response.js';
import { setAdminLogin, withAdminCookie } from '../../_shared/adminAuth.js';
import bcrypt from 'bcryptjs';

export async function onRequestPost({ request, env }) {
  const { username, password } = await parseBody(request);
  if (!username || !password) return fail('用户名或密码不能为空');

  const db = env.DB;
  const admin = await db.prepare(
    'SELECT id, username, password_hash FROM registers_admin WHERE username = ?'
  ).bind(username).first();

  if (!admin) return fail('用户名或密码不正确');

  // 首次登录初始化
  if (admin.password_hash === 'INIT_PLACEHOLDER') {
    const defaultPwd = env.ADMIN_DEFAULT_PASSWORD;
    if (!defaultPwd) return fail('服务端未配置 ADMIN_DEFAULT_PASSWORD，请在 Pages Dashboard 环境变量中设置');
    const hash = await bcrypt.hash(defaultPwd, 10);
    await db.prepare(
      'UPDATE registers_admin SET password_hash = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?'
    ).bind(hash, admin.id).run();
    admin.password_hash = hash;
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return fail('用户名或密码不正确');

  const token = await setAdminLogin(db, admin.id, admin.username);
  const resp = ok('登录成功', { username: admin.username });
  return withAdminCookie(resp, token);
}
