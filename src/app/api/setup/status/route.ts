
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// This API route provides a reliable way to check if the .env file
// has been created, bypassing Next.js's environment variable caching.
export async function GET() {
  const envPath = path.join(process.cwd(), '.env');

  try {
    // We only check for the file's existence. If it's there, setup is considered complete.
    await fs.access(envPath);
    return NextResponse.json({ isSetupComplete: true });

  } catch (error) {
    // If the file doesn't exist (ENOENT error), it means setup is not complete.
    if (error.code === 'ENOENT') {
      return NextResponse.json({ isSetupComplete: false });
    }
    // For any other errors, log it and return false as a safe default.
    console.error('Error checking for .env file presence:', error);
    return NextResponse.json({ isSetupComplete: false, error: 'Failed to check server status.' }, { status: 500 });
  }
}
