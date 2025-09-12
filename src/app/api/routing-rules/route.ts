
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const rules = await db.all('SELECT * FROM routing_rules ORDER BY name');
    return NextResponse.json(rules);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch routing rules.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const { name, description, ou, proxy, mode, domains, bypassDomains } = await request.json();

    if (!name || !ou || !proxy || !mode) {
      return NextResponse.json({ error: 'Missing required rule fields.' }, { status: 400 });
    }

    const result = await db.run(
      'INSERT INTO routing_rules (name, description, ou, proxy, mode, domains, bypassDomains) VALUES (?, ?, ?, ?, ?, ?, ?)',
      name, description, ou, proxy, mode, domains, bypassDomains
    );

    return NextResponse.json({ id: result.lastID }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create routing rule.' }, { status: 500 });
  }
}

    