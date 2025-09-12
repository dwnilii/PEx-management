
// IMPORTANT: This implementation uses SQLite, a file-based database.
// It is NOT suitable for serverless environments like Vercel or Firebase App Hosting
// because their filesystems are ephemeral and will be erased on redeployment or scaling.
// This setup is intended ONLY for local development or traditional server environments (like a VPS)
// where the filesystem is persistent. For production on modern cloud platforms,
// a managed database service like Firebase Firestore or a hosted PostgreSQL/MySQL is strongly recommended.

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs/promises';

// Let's declare the type for our database connection
let db: Awaited<ReturnType<typeof open>> | null = null;

const defaultSettings = {
    idPrefix: 'USR-EXP-',
    idDigits: 4,
    guideContent: '<h3>Welcome to PEx!</h3><p>This is your connection guide. Your traffic is now being securely routed. If you have any questions, please contact your administrator.</p>',
    guideContentAlignment: 'ltr',
    sessionTimeoutMinutes: 15
};

async function initializeDefaultSettings(dbInstance: Awaited<ReturnType<typeof open>>) {
    const settingsKey = 'extensionCustomization';
    const existingSettings = await dbInstance.get('SELECT key FROM settings WHERE key = ?', settingsKey);

    if (!existingSettings) {
        console.log(`No default settings found. Seeding database with key '${settingsKey}'...`);
        await dbInstance.run(
            'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
            settingsKey,
            JSON.stringify(defaultSettings)
        );
        console.log('Default settings seeded successfully.');
    }
}


export async function getDb() {
  if (db) {
    return db;
  }

  try {
    const dbPath = path.join(process.cwd(), 'database.sqlite3');
    
    const newDb = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    const settingsTable = await newDb.get("SELECT name FROM sqlite_master WHERE type='table' AND name='settings';");

    if (!settingsTable) {
      console.log('Database tables not found, initializing schema...');
      const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
      const schema = await fs.readFile(schemaPath, 'utf-8');
      await newDb.exec(schema);
      console.log('Database schema initialized successfully.');
      
      // After creating tables, seed the default settings
      await initializeDefaultSettings(newDb);

    } else {
        console.log('Connected to existing database.');
        // Even if tables exist, ensure default settings are present
        await initializeDefaultSettings(newDb);
    }
    
    db = newDb;
    return db;
  } catch (error) {
    console.error('Failed to connect to or initialize the database:', error);
    throw error;
  }
}

    