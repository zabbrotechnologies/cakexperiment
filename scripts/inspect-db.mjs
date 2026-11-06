import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from '../server/neonDb.ts';

async function main() {
  const sql = getDb();
  
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `;
  console.log('TABLES IN DB:');
  console.log(tables.map(t => t.table_name));

  const columns = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'courses';
  `;
  console.log('\nCOLUMNS IN courses TABLE:');
  console.log(columns);

  const allCourses = await sql`SELECT * FROM courses;`;
  console.log('\nALL ROWS IN courses TABLE (Count: ' + allCourses.length + '):');
  console.log(allCourses);

  const orders = await sql`SELECT * FROM orders;`;
  console.log('\nORDERS COUNT:', orders.length);
  console.log(orders);

  const enrollments = await sql`SELECT * FROM enrollments;`;
  console.log('\nENROLLMENTS COUNT:', enrollments.length);
  console.log(enrollments);

  const sanjay = await sql`SELECT * FROM users WHERE email LIKE '%sanjay%';`;
  console.log('\nSANJAY USER:');
  console.log(sanjay);
}

main().catch(console.error);
