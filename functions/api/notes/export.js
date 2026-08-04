// 备忘录导出（直接返回文本内容，小程序端本地保存）
// GET /api/notes/export
//
// 说明：原 PHP 版本会写一个 txt 文件到服务器 exports/ 目录并返回下载链接。
// Pages Functions 没有持久文件系统，按商定方案改为：
//   - 直接返回 txt 文本内容（content-type: text/plain）
//   - 同时在 exports 表记录一次导出动作（保留审计）
//   - 小程序拿到内容后用 wx.getFileSystemManager().writeFile + wx.saveFileToDisk 保存
//
// 响应体：
//   { code: 0, msg: 'success', data: { content: '...', fileName: 'xxx.txt' } }
import { ok } from '../../_shared/response.js';
import { getUserByToken } from '../../_shared/auth.js';
import { nowString, generateExportFileName, formatShanghaiDate } from '../../_shared/db.js';

export async function onRequestGet({ request, env }) {
  const auth = await getUserByToken(request, env.DB);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  // 拉取该用户所有备忘录
  const { results } = await env.DB.prepare(
    `SELECT id, title, content, create_time
     FROM notes
     WHERE user_id = ?
     ORDER BY create_time DESC`
  ).bind(user.id).all();

  const notes = results || [];
  const nickname = user.nickname || user.username || 'user';
  const fileName = generateExportFileName(nickname);

  // 生成 txt 内容（保持与原 PHP 版本格式一致）
  let txt = `===== 备忘录导出 - 用户：${nickname} =====\n`;
  txt += `===== 导出时间：${nowString()} =====\n\n`;

  if (notes.length === 0) {
    txt += '暂无备忘录内容\n';
  } else {
    notes.forEach((n, i) => {
      txt += `[${i + 1}] 标题：${n.title}\n`;
      txt += `创建时间：${n.create_time}\n`;
      txt += `内容：\n${n.content}\n\n`;
      txt += '----------------------------------------\n\n';
    });
  }

  // 记录导出动作（24小时后过期，原 PHP 逻辑保留）
  // 用上海时区时间
  const now = nowString();
  const expireStr = formatShanghaiDate(new Date(Date.now() + 24 * 3600 * 1000));
  await env.DB.prepare(
    `INSERT INTO exports (user_id, file_name, create_time, expire_time)
     VALUES (?, ?, ?, ?)`
  ).bind(user.id, fileName, now, expireStr).run();

  // 清理过期导出记录（用上海时区时间比较）
  await env.DB.prepare(
    `DELETE FROM exports WHERE expire_time < ?`
  ).bind(now).run();

  return ok('success', {
    content: txt,
    fileName,
  });
}
