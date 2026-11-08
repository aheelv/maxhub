-- 字段逻辑示意，需与WorkBuddy课堂云服务实际能力核对，不保证可直接执行。
CREATE TABLE events (event_id TEXT PRIMARY KEY, title TEXT NOT NULL, start_at TEXT NOT NULL, capacity INTEGER NOT NULL CHECK (capacity > 0), status TEXT NOT NULL);
CREATE TABLE registrations (registration_id TEXT PRIMARY KEY, event_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at TIMESTAMP NOT NULL, status TEXT NOT NULL);
-- 用户归属与名额校验须由可信服务端/平台访问策略保护。
