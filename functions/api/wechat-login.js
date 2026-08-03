// 微信小程序登录
// POST /api/wechat-login
// body: { code, nickname, registercode }
import { parseBody, ok, fail } from '../_shared/response.js';
import { generateToken, tokenExpireString } from '../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  const { code, nickname, registercode } = await parseBody(request);

  if (!code) return fail('code不能为空');
  if (!nickname) return fail('昵称不能为空');

  const db = env.DB;
  const appid = env.WX_APPID;
  const secret = env.WX_SECRET;

  if (!appid) return fail('服务端未配置 WX_APPID，请在 Pages Dashboard 环境变量中设置');
  if (!secret) return fail('服务端未配置 WX_SECRET，请在 Pages Dashboard 环境变量 Secret 中设置');

  // 调用微信 code2session 接口
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
  const wxResp = await fetch(url);
  const wxResult = await wxResp.json();

  if (wxResult.errcode) {
    return fail('获取openid失败: ' + (wxResult.errmsg || ''));
  }

  const openid = wxResult.openid;
  if (!openid) return fail('获取openid失败');

  // 检查用户是否已存在
  let user = await db.prepare(
    'SELECT id, nickname FROM users WHERE openid = ?'
  ).bind(openid).first();

  let userId;
  if (user) {
    // 已存在，更新昵称
    await db.prepare('UPDATE users SET nickname = ? WHERE id = ?').bind(nickname, user.id).run();
    userId = user.id;
  } else {
    // 新用户，校验注册码
    if (!registercode) return fail('注册码不能为空');
    const codeRow = await db.prepare(
      'SELECT id FROM registers WHERE registercode = ?'
    ).bind(registercode).first();
    if (!codeRow) return fail('注册码不正确');

    // 插入新用户
    const ins = await db.prepare(
      `INSERT INTO users (openid, nickname, register_time)
       VALUES (?, ?, datetime('now', 'localtime'))`
    ).bind(openid, nickname).run();
    userId = ins.meta.last_row_id;

    // 删除用过的注册码
    await db.prepare('DELETE FROM registers WHERE registercode = ?').bind(registercode).run();
  }

  // 生成并保存 token
  const token = generateToken(openid);
  const expire = tokenExpireString();
  await db.prepare(
    'UPDATE users SET token = ?, token_expire = ? WHERE id = ?'
  ).bind(token, expire, userId).run();

  // 返回用户信息
  const userInfo = await db.prepare(
    'SELECT id, nickname, openid, register_time FROM users WHERE id = ?'
  ).bind(userId).first();
  userInfo.token = token;

  return ok('登录成功', userInfo);
}
