
'use server';

import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config'; 

// Helper function to parse .env content
function parseEnv(content: string) {
    const lines = content.split('\n');
    const env: { [key: string]: string } = {};
    for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            env[key] = value;
        }
    }
    return env;
}

export async function updateCredentials(data: {
  currentUsername?: string;
  currentPassword?: string;
  newUsername?: string;
  newPassword?: string;
}) {
  const { currentUsername, currentPassword, newUsername, newPassword } = data;
  const envPath = path.join(process.cwd(), '.env');

  try {
    // 1. Read current credentials directly from the .env file.
    const envFileContent = await fs.readFile(envPath, 'utf-8');
    const envVars = parseEnv(envFileContent);
    const serverUsername = envVars.ADMIN_USERNAME;
    const serverPassword = envVars.ADMIN_PASSWORD;

    // 2. Validate current credentials.
    if (serverUsername !== currentUsername || serverPassword !== currentPassword) {
        return { success: false, error: 'Current username or password is incorrect.' };
    }
    
    if (!newUsername || !newPassword) {
        return { success: false, error: 'New username and password cannot be empty.' };
    }

    // 3. Update and write the new credentials to the .env file.
    let lines = envFileContent.split('\n');
    let usernameUpdated = false;
    let passwordUpdated = false;

    lines = lines.map(line => {
      if (line.startsWith('ADMIN_USERNAME=')) {
        usernameUpdated = true;
        return `ADMIN_USERNAME="${newUsername}"`;
      }
      if (line.startsWith('ADMIN_PASSWORD=')) {
        passwordUpdated = true;
        return `ADMIN_PASSWORD="${newPassword}"`;
      }
      return line;
    });

    if (!usernameUpdated) {
      lines.push(`ADMIN_USERNAME="${newUsername}"`);
    }
    if (!passwordUpdated) {
      lines.push(`ADMIN_PASSWORD="${newPassword}"`);
    }

    const newEnvContent = lines.join('\n');
    await fs.writeFile(envPath, newEnvContent);

    // No restart needed. Return a success message.
    return { success: true, message: 'Credentials updated successfully. You will be logged out.' };

  } catch (error) {
    console.error('Failed to update .env file:', error);
    if (error.code === 'ENOENT') {
        return { success: false, error: 'Could not find the credentials file on the server.' };
    }
    return {
      success: false,
      error: 'Could not update credentials file on the server. Check server permissions and logs.',
    };
  }
}
