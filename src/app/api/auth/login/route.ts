
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

// Helper function to parse .env content
function parseEnv(content: string) {
    const lines = content.split('\n');
    const env: { [key: string]: string } = {};
    for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            // Remove surrounding quotes
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            env[key] = value;
        }
    }
    return env;
}


export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const envPath = path.join(process.cwd(), '.env');

    let adminUsername = '';
    let adminPassword = '';

    try {
        const envContent = await fs.readFile(envPath, 'utf-8');
        const envVars = parseEnv(envContent);
        adminUsername = envVars.ADMIN_USERNAME || '';
        adminPassword = envVars.ADMIN_PASSWORD || '';
    } catch (error) {
        // If file doesn't exist, credentials are not set.
        if (error.code !== 'ENOENT') {
            console.error('Error reading .env file during login:', error);
        }
    }

    if (!adminUsername || !adminPassword) {
      return NextResponse.json({ error: 'Panel is not configured. No credentials set.' }, { status: 500 });
    }

    const isUsernameCorrect = username === adminUsername;
    const isPasswordCorrect = password === adminPassword;

    if (isUsernameCorrect && isPasswordCorrect) {
      return NextResponse.json({ message: 'Login successful' });
    } else {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
