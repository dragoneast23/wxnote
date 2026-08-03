-- wxnote D1 数据库 schema
-- 适配 SQLite (D1) 语法

-- 用户表（合并账密用户和微信用户）
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,                          -- 账密注册用户名（微信用户为 NULL）
    openid TEXT UNIQUE,                            -- 微信 openid（账密用户为 NULL）
    password TEXT,                                 -- bcrypt 密码哈希（微信用户为 NULL）
    nickname TEXT NOT NULL DEFAULT '',
    register_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    token TEXT,                                    -- 登录 token
    token_expire TEXT                              -- token 过期时间（文本格式）
);

-- 注册码表
DROP TABLE IF EXISTS registers;
CREATE TABLE registers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registercode TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 管理员表
DROP TABLE IF EXISTS registers_admin;
CREATE TABLE registers_admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    token TEXT,
    token_expire TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 备忘录表（合并所有用户到单表，用 user_id 区分）
-- 原设计是每个用户一张 notes_{userId} 表，D1 中改为单表 + 索引
DROP TABLE IF EXISTS notes;
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    create_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    update_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    word_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_update_time ON notes(update_time);

-- 导出记录表（保留记录用，文件不再落盘）
DROP TABLE IF EXISTS exports;
CREATE TABLE exports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    create_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    expire_time TEXT NOT NULL
);

CREATE INDEX idx_exports_user_id ON exports(user_id);
CREATE INDEX idx_exports_expire_time ON exports(expire_time);

-- 初始化默认管理员（用户名 along，密码 wjl403224736）
-- 密码哈希通过应用层在首次启动时生成，此处先插入占位
INSERT INTO registers_admin (username, password_hash) VALUES ('along', 'INIT_PLACEHOLDER');
