// 数据库辅助函数

/**
 * 计算字符串字数（按 UTF-8 字符计，等价于 PHP mb_strlen）
 */
export function utf8Length(str) {
  if (!str) return 0;
  // Array.from 会按 Unicode 码点拆分，emoji 等也能正确计数
  return Array.from(String(str)).length;
}

/**
 * 当前上海时区(UTC+8)时间字符串 YYYY-MM-DD HH:MM:SS
 *
 * 说明：Cloudflare Workers 运行在 UTC 时区，new Date() 和 D1 的
 * datetime('now','localtime') 返回的都是 UTC 时间，比上海时间晚 8 小时。
 * 所以统一在这里用 UTC+8 偏移计算，所有需要"本地时间"的地方都调用此函数。
 */
export function nowString() {
  return formatShanghaiDate(new Date());
}

/**
 * 把任意 Date 对象格式化为上海时区(UTC+8)字符串
 */
export function formatShanghaiDate(d) {
  // 转为 UTC+8 毫秒数
  const utc8Ms = d.getTime() + 8 * 3600 * 1000;
  const d2 = new Date(utc8Ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d2.getUTCFullYear()}-${pad(d2.getUTCMonth() + 1)}-${pad(d2.getUTCDate())} ${pad(d2.getUTCHours())}:${pad(d2.getUTCMinutes())}:${pad(d2.getUTCSeconds())}`;
}

/**
 * 生成随机注册码（8-16位字母数字）
 * 对应原 PHP generateRandomCode
 */
export function generateRegisterCode(length) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < length; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

/**
 * 生成导出文件名（使用上海时区时间戳）
 */
export function generateExportFileName(nickname) {
  const d = new Date();
  const utc8Ms = d.getTime() + 8 * 3600 * 1000;
  const d2 = new Date(utc8Ms);
  const pad = (n) => String(n).padStart(2, '0');
  const ts = `${d2.getUTCFullYear()}${pad(d2.getUTCMonth() + 1)}${pad(d2.getUTCDate())}${pad(d2.getUTCHours())}${pad(d2.getUTCMinutes())}${pad(d2.getUTCSeconds())}`;
  const safeName = (nickname || 'user').replace(/[\\/:*?"<>|]/g, '_');
  return `${safeName}_${ts}_.txt`;
}
