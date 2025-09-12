
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const ous = await db.all('SELECT * FROM ous ORDER BY name');
    return NextResponse.json(ous);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch OUs.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const { name, description, color, proxy, routingRule } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'OU name is required.' }, { status: 400 });
    }

    const result = await db.run(
      'INSERT INTO ous (name, description, color, proxy, routingRule) VALUES (?, ?, ?, ?, ?)',
      name, description, color, proxy, routingRule
    );

    return NextResponse.json({ id: result.lastID }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create OU.' }, { status: 500 });
  }
}

    