// 备忘录列表 / 新增
// GET  /api/notes        → 获取当前用户所有备忘录（按 update_time 倒序）
// POST /api/notes        → 新增备忘录
//    body: { title, content }
import { parseBody, ok, fail, unauthorized } from '../../_shared/response.js';
import { getUserByToken } from '../../_shared/auth.js';
import { utf8Length, nowString } from '../../_shared/db.js';

// GET 列表
export async function onRequestGet({ request, env }) {
  const auth = await getUserByToken(request, env.DB);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const { results } = await env.DB.prepare(
    `SELECT id, title, content, update_time, word_count
     FROM notes
     WHERE user_id = ?
     ORDER BY update_time DESC`
  ).bind(user.id).all();

  return ok('success', results || []);
}

// POST 新增
export async function onRequestPost({ request, env }) {
  const auth = await getUserByToken(request, env.DB);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const { title, content } = await parseBody(request);
  if (!title && !content) return fail('标题和内容不能为空');

  const wordCount = utf8Length(title) + utf8Length(content);
  const now = nowString();

  const result = await env.DB.prepare(
    `INSERT INTO notes (user_id, title, content, create_time, update_time, word_count)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(user.id, title || '', content || '', now, now, wordCount).run();

  const noteId = result.meta.last_row_id;
  const note = await env.DB.prepare(
    'SELECT id, title, content, create_time, word_count FROM notes WHERE id = ?'
  ).bind(noteId).first();

  return ok('添加成功', note);
}
