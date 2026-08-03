// 备忘录详情 / 更新 / 删除
// GET    /api/notes/{id}  → 详情
// PUT    /api/notes/{id}  → 更新  body: { title, content }
// DELETE /api/notes/{id}  → 删除
import { parseBody, ok, fail } from '../../_shared/response.js';
import { getUserByToken } from '../../_shared/auth.js';
import { utf8Length, nowString } from '../../_shared/db.js';

// GET 详情
export async function onRequestGet({ request, env, params }) {
  const auth = await getUserByToken(request, env.DB);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const id = parseInt(params.id, 10);
  if (!id) return fail('参数错误');

  const note = await env.DB.prepare(
    `SELECT id, title, content, update_time, word_count
     FROM notes
     WHERE id = ? AND user_id = ?`
  ).bind(id, user.id).first();

  if (!note) return fail('备忘录不存在');
  return ok('success', note);
}

// PUT 更新
export async function onRequestPut({ request, env, params }) {
  const auth = await getUserByToken(request, env.DB);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const id = parseInt(params.id, 10);
  if (!id) return fail('参数错误');

  const { title, content } = await parseBody(request);
  if (!title && !content) return fail('标题和内容不能为空');

  // 校验归属
  const exist = await env.DB.prepare(
    'SELECT id FROM notes WHERE id = ? AND user_id = ?'
  ).bind(id, user.id).first();
  if (!exist) return fail('备忘录不存在');

  const wordCount = utf8Length(title) + utf8Length(content);
  const now = nowString();
  await env.DB.prepare(
    `UPDATE notes
     SET title = ?, content = ?, update_time = ?, word_count = ?
     WHERE id = ? AND user_id = ?`
  ).bind(title || '', content || '', now, wordCount, id, user.id).run();

  const note = await env.DB.prepare(
    'SELECT id, title, content, update_time, word_count FROM notes WHERE id = ?'
  ).bind(id).first();
  return ok('更新成功', note);
}

// DELETE 删除
export async function onRequestDelete({ request, env, params }) {
  const auth = await getUserByToken(request, env.DB);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const id = parseInt(params.id, 10);
  if (!id) return fail('参数错误');

  const exist = await env.DB.prepare(
    'SELECT id FROM notes WHERE id = ? AND user_id = ?'
  ).bind(id, user.id).first();
  if (!exist) return fail('备忘录不存在');

  await env.DB.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').bind(id, user.id).run();
  return ok('删除成功');
}
