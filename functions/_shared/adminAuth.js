// 管理员鉴权
// 通过 Cookie 中的 admin_token 鉴权（管理后台用浏览器访问，Cookie 合适）
import { unauthorized } from './response.js';
import { generateToken, tokenExpireString } from './auth.js';
import { formatShanghaiDate } from './db.js';

/**
 * 通过 Cookie 获取当前管理员
 * @param {Request} request
 * @param {D1Database} db
 * @returns {Promise<{admin: object}|Response>}
 */
export async function getAdminByCookie(request, db) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/admin_token=([^;]+)/);
  const token = match ? match[1] : '';
  if (!token) return unauthorized('未登录');

  // 用上海时区时间比较
  const now = formatShanghaiDate(new Date());
  const admin = await db.prepare(
    `SELECT id, username
     FROM registers_admin
     WHERE token = ? AND token_expire > ?`
  ).bind(token, now).first();

  if (!admin) return unauthorized('登录已过期');
  return { admin };
}

/**
 * 设置管理员登录态：把 token 写入数据库，并返回带 Cookie 的响应
 */
export async function setAdminLogin(db, adminId, username) {
  const token = generateToken('admin:' + username);
  const expire = tokenExpireString();
  await db.prepare(
    'UPDATE registers_admin SET token = ?, token_expire = ? WHERE id = ?'
  ).bind(token, expire, adminId).run();
  return token;
}

/**
 * 给响应添加 admin_token Cookie（7天有效期，HttpOnly）
 */
export function withAdminCookie(response, token) {
  const clone = response.clone();
  const headers = new Headers(clone.headers);
  headers.append(
    'Set-Cookie',
    `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
  );
  return new Response(clone.body, {
    status: clone.status,
    statusText: clone.statusText,
    headers,
  });
}

/**
 * 清除 admin_token Cookie
 */
export function clearAdminCookie(response) {
  const clone = response.clone();
  const headers = new Headers(clone.headers);
  headers.append(
    'Set-Cookie',
    `admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return new Response(clone.body, {
    status: clone.status,
    statusText: clone.statusText,
    headers,
  });
}
