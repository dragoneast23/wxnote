// 备忘录搜索
// GET /api/notes/search?keyword=xxx
import { ok, fail } from '../../_shared/response.js';
import { getUserByToken } from '../../_shared/auth.js';
import { getQuery } from '../../_shared/response.js';

export async function onRequestGet({ request, env }) {
  const auth = await getUserByToken(request, env.DB);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const { keyword } = getQuery(request);
  if (!keyword) return fail('搜索关键词不能为空');

  const like = `%${keyword}%`;
  const { results } = await env.DB.prepare(
    `SELECT id, title, content, create_time, update_time, word_count
     FROM notes
     WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
     ORDER BY update_time DESC`
  ).bind(user.id, like, like).all();

  return ok('success', results || []);
}
