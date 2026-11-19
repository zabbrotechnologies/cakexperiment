import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function check() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT id, connected_email, is_connected, folder_name, folder_id, updated_at FROM google_drive_storage;`;
    console.log('google_drive_storage rows:', JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('DB query error:', e.message);
  }
}
check();
