
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const db = await getDb();
    const body = await request.json();

    // Build the query dynamically based on the fields provided in the body
    const fields = Object.keys(body);
    const values = Object.values(body);
    
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');

    await db.run(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      ...values,
      id
    );

    return NextResponse.json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const db = await getDb();
        await db.run('DELETE FROM users WHERE id = ?', id);
        return NextResponse.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
    }
}
