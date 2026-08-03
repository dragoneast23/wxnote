DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    openid TEXT UNIQUE,
    password TEXT,
    nickname TEXT NOT NULL DEFAULT '',
    register_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    token TEXT,
    token_expire TEXT
);
DROP TABLE IF EXISTS registers;
CREATE TABLE registers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registercode TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
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
INSERT INTO registers_admin (username, password_hash) VALUES ('along', 'INIT_PLACEHOLDER');
