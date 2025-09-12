
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const db = await getDb();
    const { name, description, color, proxy, routingRule } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'OU name is required.' }, { status: 400 });
    }

    await db.run(
      'UPDATE ous SET name = ?, description = ?, color = ?, proxy = ?, routingRule = ? WHERE id = ?',
      name, description, color, proxy, routingRule, id
    );

    return NextResponse.json({ message: 'OU updated successfully.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update OU.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const db = await getDb();
        await db.run('DELETE FROM ous WHERE id = ?', id);
        return NextResponse.json({ message: 'OU deleted successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete OU.' }, { status: 500 });
    }
}
