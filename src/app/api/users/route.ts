
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const users = await db.all('SELECT * FROM users ORDER BY name');
    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const { name, userId, ou, status, customConfigEnabled, customProxyConfig } = await request.json();

    if (!name || !userId) {
      return NextResponse.json({ error: 'User name and ID are required.' }, { status: 400 });
    }

    const result = await db.run(
      'INSERT INTO users (name, userId, ou, ip, status, customConfigEnabled, customProxyConfig) VALUES (?, ?, ?, ?, ?, ?, ?)',
      name, userId, ou, 'N/A', status || 'active', customConfigEnabled || 0, customProxyConfig
    );

    return NextResponse.json({ id: result.lastID }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}

    