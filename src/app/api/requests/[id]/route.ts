
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const db = await getDb();
    const { name, ou, status } = await request.json();

    if (!status) {
        return NextResponse.json({ error: 'Status is required.' }, { status: 400 });
    }

    await db.run(
      'UPDATE requests SET name = ?, ou = ?, status = ? WHERE id = ?',
      name, ou, status, id
    );

    return NextResponse.json({ message: 'Request updated successfully.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update request.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const db = await getDb();
        await db.run('DELETE FROM requests WHERE id = ?', id);
        return NextResponse.json({ message: 'Request deleted successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete request.' }, { status: 500 });
    }
}
