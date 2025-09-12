
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const proxies = await db.all('SELECT * FROM proxies ORDER BY name');
    // We don't want to expose passwords
    const safeProxies = proxies.map(({ password, ...rest }) => rest);
    return NextResponse.json(safeProxies);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch proxies.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const { name, protocol, ip, port, username, password } = await request.json();

    if (!name || !protocol || !ip || !port) {
      return NextResponse.json({ error: 'Missing required proxy fields.' }, { status: 400 });
    }

    const result = await db.run(
      'INSERT INTO proxies (name, protocol, ip, port, username, password) VALUES (?, ?, ?, ?, ?, ?)',
      name, protocol, ip, port, username, password
    );

    return NextResponse.json({ id: result.lastID }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create proxy.' }, { status: 500 });
  }
}

    