# wxnote - 个人备忘录小程序后端

从 PHP + MySQL 迁移到 **Cloudflare Pages Functions + D1**。

## 技术栈

- **运行时**：Cloudflare Pages Functions（基于 Workers）
- **数据库**：Cloudflare D1（SQLite）
- **语言**：JavaScript (ES Modules)
- **密码哈希**：bcryptjs（兼容 PHP `password_hash` 生成的 `$2y$` 哈希）

## 目录结构

```
wxnote/
├── functions/                # Pages Functions (API)
│   ├── _shared/              # 共享工具函数
│   │   ├── response.js       # 统一响应/CORS
│   │   ├── auth.js           # token 验证
│   │   └── db.js             # 数据库辅助
│   └── api/
│       ├── _middleware.js    # 全局中间件
│       ├── register.js       # 账密注册
│       ├── login.js          # 账密登录
│       ├── wechat-login.js   # 微信登录
│       ├── logout.js         # 退出
│       ├── change-password.js# 改密
│       ├── notes/            # 备忘录 CRUD
│       │   ├── index.js      # GET 列表 / POST 新增
│       │   ├── [id].js       # GET 详情 / PUT 更新 / DELETE 删除
│       │   ├── search.js     # 搜索
│       │   └── export.js     # 导出（直接返回文本）
│       └── admin/            # 管理后台 API
│           ├── login.js
│           ├── logout.js
│           ├── registers.js  # 注册码管理
│           ├── users.js      # 用户列表
│           └── reset-password.js
├── admin/                    # 管理后台静态页
│   ├── index.html            # 登录入口
│   ├── zcm.html              # 注册码管理
│   └── mima.html             # 用户密码重置
├── public/                   # 静态资源
│   └── index.html
├── schema.sql                # D1 建表语句
├── wrangler.toml             # Cloudflare 配置
└── package.json
```

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 创建本地 D1 数据库（首次）
npx wrangler d1 create wxnote
# 把输出的 database_id 填入 wrangler.toml

# 3. 初始化数据库表结构
npm run db:init

# 4. 设置微信 secret
npx wrangler pages secret put WX_SECRET

# 5. 启动本地开发服务器
npm run dev
```

## 部署到 Cloudflare Pages

### 方式一：Git 自动部署（推荐）
1. 把本仓库推到 GitHub
2. Cloudflare Dashboard → Pages → Create a project → Connect to Git
3. 选择仓库 `dragoneast23/wxnote`
4. Build settings：
   - Framework preset: `None`
   - Build command: `npm install`
   - Build output directory: `public`
5. Settings → Functions → D1 database bindings：绑定 `DB` → `wxnote`
6. Settings → Environment variables：`WX_APPID`、`ADMIN_DEFAULT_PASSWORD`、`RESET_DEFAULT_PASSWORD`
7. Settings → Environment variables (Secrets)：`WX_SECRET`
8. 每次 push 自动部署

### 方式二：Wrangler CLI 手动部署
```bash
npm run deploy
```

## 数据模型变更说明

原 PHP 版本：每个用户一张 `notes_{userId}` 表（动态 CREATE TABLE）
新版本：合并为单表 `notes`，通过 `user_id` 字段区分，并建立索引

## API 接口

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/register` | POST | 账密注册（需注册码） |
| `/api/login` | POST | 账密登录 |
| `/api/wechat-login` | POST | 微信登录 |
| `/api/logout` | POST | 退出登录 |
| `/api/change-password` | POST | 修改密码 |
| `/api/notes` | GET | 获取备忘录列表 |
| `/api/notes` | POST | 新增备忘录 |
| `/api/notes/{id}` | GET | 获取详情 |
| `/api/notes/{id}` | PUT | 更新 |
| `/api/notes/{id}` | DELETE | 删除 |
| `/api/notes/search?keyword=` | GET | 搜索 |
| `/api/notes/export` | GET | 导出（返回文本，小程序本地保存） |
| `/api/admin/login` | POST | 管理员登录 |
| `/api/admin/logout` | POST | 管理员退出 |
| `/api/admin/registers` | GET/POST/DELETE | 注册码管理 |
| `/api/admin/users` | GET | 用户列表 |
| `/api/admin/reset-password` | POST | 重置用户密码 |
