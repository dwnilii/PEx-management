-- Users table to store registered and approved users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    userId TEXT NOT NULL UNIQUE,
    ou TEXT,
    ip TEXT,
    status TEXT DEFAULT 'active', -- active, disabled
    customConfigEnabled INTEGER DEFAULT 0, -- 0 for false, 1 for true
    customProxyConfig TEXT, -- JSON object for custom settings
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Organizational Units (OUs) table
CREATE TABLE IF NOT EXISTS ous (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    proxy TEXT,
    routingRule TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Proxies table
CREATE TABLE IF NOT EXISTS proxies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    protocol TEXT NOT NULL, -- http, https, socks4, socks5
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT,
    password TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Routing Rules table
CREATE TABLE IF NOT EXISTS routing_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    ou TEXT NOT NULL,
    proxy TEXT NOT NULL,
    mode TEXT NOT NULL, -- proxyAll, directExcept
    domains TEXT, -- JSON array of strings
    bypassDomains TEXT, -- JSON array of strings
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Connection Requests table for new users awaiting approval
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    ipAddress TEXT,
    ou TEXT,
    status TEXT NOT NULL, -- Pending, Approved, Rejected
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings table for general application settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
