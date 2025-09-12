
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const db = await getDb();
    const { name, protocol, ip, port, username, password } = await request.json();

    if (!name || !protocol || !ip || !port) {
      return NextResponse.json({ error: 'Missing required proxy fields.' }, { status: 400 });
    }

    // Only update the password if a new one is provided.
    if (password) {
        await db.run(
          'UPDATE proxies SET name = ?, protocol = ?, ip = ?, port = ?, username = ?, password = ? WHERE id = ?',
          name, protocol, ip, port, username, password, id
        );
    } else {
        await db.run(
          'UPDATE proxies SET name = ?, protocol = ?, ip = ?, port = ?, username = ? WHERE id = ?',
          name, protocol, ip, port, username, id
        );
    }


    return NextResponse.json({ message: 'Proxy updated successfully.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update proxy.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const db = await getDb();
        await db.run('DELETE FROM proxies WHERE id = ?', id);
        return NextResponse.json({ message: 'Proxy deleted successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete proxy.' }, { status: 500 });
    }
}
