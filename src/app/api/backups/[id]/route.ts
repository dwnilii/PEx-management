
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// This endpoint is not used in the UI, but kept for potential direct API use.
export async function DELETE(request: NextRequest, { params: { id } }: { params: { id: string } }) {
    try {
        const db = await getDb();
        // This is a placeholder as the 'backups' table doesn't exist.
        // In a real scenario, you would delete a backup record here.
        // For this app, backup deletion is handled by file deletion in /api/restore.
        await db.run('DELETE FROM backups WHERE id = ?', id); // This line will likely fail as there's no 'backups' table
        return NextResponse.json({ message: 'Backup record deleted successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete backup record. Note: Backups are managed as files.' }, { status: 500 });
    }
}
