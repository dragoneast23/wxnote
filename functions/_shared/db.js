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
 * 当前本地时间字符串 YYYY-MM-DD HH:MM:SS
 */
export function nowString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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
 * 生成导出文件名
 */
export function generateExportFileName(nickname) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const safeName = (nickname || 'user').replace(/[\\/:*?"<>|]/g, '_');
  return `${safeName}_${ts}_.txt`;
}
