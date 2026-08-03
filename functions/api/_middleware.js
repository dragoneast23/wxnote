// 全局中间件：处理 OPTIONS 预检，给所有 /api/* 响应加 CORS
import { handleOptions } from '../_shared/response.js';

export async function onRequest(context) {
  const { request } = context;

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // 继续向后传递
  return context.next();
}
