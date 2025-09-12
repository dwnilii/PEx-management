
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const db = await getDb();
    const { name, description, ou, proxy, mode, domains, bypassDomains } = await request.json();

    if (!name || !ou || !proxy || !mode) {
      return NextResponse.json({ error: 'Missing required rule fields.' }, { status: 400 });
    }

    await db.run(
      'UPDATE routing_rules SET name = ?, description = ?, ou = ?, proxy = ?, mode = ?, domains = ?, bypassDomains = ? WHERE id = ?',
      name, description, ou, proxy, mode, domains, bypassDomains, id
    );

    return NextResponse.json({ message: 'Rule updated successfully.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update rule.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const db = await getDb();
        await db.run('DELETE FROM routing_rules WHERE id = ?', id);
        return NextResponse.json({ message: 'Rule deleted successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete rule.' }, { status: 500 });
    }
}
