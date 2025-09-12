
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const requests = await db.all('SELECT * FROM requests ORDER BY createdAt DESC');
    return NextResponse.json(requests);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch requests.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const { userId, userName, ipAddress } = await request.json();

    if (!userId || !userName) {
      return NextResponse.json({ error: 'User ID and User Name are required.' }, { status: 400 });
    }

    // Check if a user with this userId already exists in the main users table
    const existingUser = await db.get('SELECT id FROM users WHERE userId = ?', userId);
    if (existingUser) {
        return NextResponse.json({ error: 'This User ID is already registered and approved.' }, { status: 409 });
    }


    // Check if a request for this userId already exists
    const existingRequest = await db.get('SELECT id FROM requests WHERE userId = ?', userId);
    if (existingRequest) {
        // This prevents duplicate requests. A user should not be able to spam requests.
        // The admin should process the existing one.
        return NextResponse.json({ error: 'A registration request for this User ID already exists.' }, { status: 409 });
    }
    
    const result = await db.run(
      'INSERT INTO requests (userId, name, ipAddress, status) VALUES (?, ?, ?, ?)',
      userId, userName, ipAddress || 'N/A', 'Pending'
    );

    return NextResponse.json({ message: 'Request logged successfully.', id: result.lastID }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create request.' }, { status: 500 });
  }
}
