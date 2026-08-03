// 统一响应与 CORS 工具

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'token, Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * 返回 JSON 响应（自动带 CORS 头）
 * @param {object} data - 响应体
 * @param {number} status - HTTP 状态码
 */
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

/**
 * 成功响应：{code: 0, msg, data}
 */
export function ok(msg = 'success', data = null) {
  return json({ code: 0, msg, data });
}

/**
 * 失败响应：{code: 1, msg}
 */
export function fail(msg = 'error', code = 1) {
  return json({ code, msg });
}

/**
 * 未登录/登录过期：{code: 401, msg}
 */
export function unauthorized(msg = '未登录') {
  return json({ code: 401, msg }, 401);
}

/**
 * 处理 OPTIONS 预检请求
 */
export function handleOptions(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  return null;
}

/**
 * 解析请求体（兼容 form-data 和 JSON）
 */
export async function parseBody(request) {
  const contentType = (request.headers.get('Content-Type') || '').toLowerCase();
  if (contentType.includes('application/json')) {
    try {
      return await request.json();
    } catch {
      return {};
    }
  }
  // 默认按 form-data 解析
  try {
    const form = await request.formData();
    const obj = {};
    for (const [k, v] of form.entries()) {
      obj[k] = v;
    }
    return obj;
  } catch {
    return {};
  }
}

/**
 * 获取 URL 查询参数
 */
export function getQuery(request) {
  const url = new URL(request.url);
  const obj = {};
  for (const [k, v] of url.searchParams.entries()) {
    obj[k] = v;
  }
  return obj;
}
