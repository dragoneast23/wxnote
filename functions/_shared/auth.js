// Token 验证与用户身份解析

import { unauthorized } from './response.js';

/**
 * 通过 token 获取当前登录用户
 * @param {Request} request
 * @param {D1Database} db
 * @returns {Promise<{user: object}|Response>}
 *   - 验证成功返回 { user }
 *   - 验证失败返回 Response（直接 return 给客户端）
 */
export async function getUserByToken(request, db) {
  const token = request.headers.get('token') || '';
  if (!token) {
    return unauthorized('未登录');
  }

  const user = await db.prepare(
    `SELECT id, username, openid, nickname, register_time
     FROM users
     WHERE token = ? AND token_expire > datetime('now', 'localtime')`
  ).bind(token).first();

  if (!user) {
    return unauthorized('登录已过期');
  }

  return { user };
}

/**
 * 生成随机 token（对应原 PHP 的 md5(uniqid(mt_rand(), true).username.time())）
 */
export function generateToken(seed = '') {
  const rand = Math.random().toString(36).slice(2);
  const time = Date.now().toString(36);
  const raw = rand + seed + time + Math.random().toString(36).slice(2);
  // 简易 hash 模拟 md5 长度（32位十六进制）
  let hash = 0n;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 131n + BigInt(raw.charCodeAt(i))) & 0xffffffffffffffffn;
  }
  // 不足32位补随机字符
  const hex = hash.toString(16).padStart(16, '0');
  const extra = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return (hex + extra).slice(0, 32);
}

/**
 * 计算 token 过期时间（7天后，本地时间字符串）
 */
export function tokenExpireString() {
  const d = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
