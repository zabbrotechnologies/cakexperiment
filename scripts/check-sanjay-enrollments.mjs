import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function inspectEnrollments() {
  const users = await sql`SELECT id, name, email FROM users WHERE email = 's.sanjay.01.03.2006@gmail.com';`;
  console.log('User:', users);
  if (users.length > 0) {
    const enrollments = await sql`SELECT * FROM enrollments WHERE user_id = ${users[0].id};`;
    console.log('Enrollments for Sanjay:', enrollments);

    const orders = await sql`SELECT id, order_number, course_id, order_status, payment_status, course_access_status FROM orders WHERE user_id = ${users[0].id};`;
    console.log('Orders for Sanjay:', orders);
  }
}

inspectEnrollments().catch(console.error);

