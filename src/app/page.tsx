
import { redirect } from 'next/navigation';
import 'dotenv/config';

// This function now fetches the status from a reliable API endpoint.
async function getSetupStatus() {
  try {
    // We must use an absolute path for fetch on the server.
    // NEXT_PUBLIC_BASE_URL should be set in production, but for local dev, we default to localhost.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/setup/status`, { cache: 'no-store' });
    
    if (!response.ok) {
      console.error('Failed to fetch setup status, assuming setup is not complete.');
      return false;
    }

    const data = await response.json();
    return data.isSetupComplete;
  } catch (error) {
    console.error('Error fetching setup status:', error);
    // In case of any error (e.g., network), assume setup is not done to be safe.
    return false;
  }
}

export default async function Home() {
  const isSetupComplete = await getSetupStatus();

  if (isSetupComplete) {
    redirect('/login');
  } else {
    redirect('/setup');
  }

  // This return is never reached due to the redirects, but it's required.
  return null;
}
