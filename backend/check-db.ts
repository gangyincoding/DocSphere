import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await connection.query('SHOW TABLES');
    console.log('数据库中的表:', rows);
    console.log('表数量:', (rows as any[]).length);

    if ((rows as any[]).length > 0) {
      console.log('\n表详情:');
      for (const row of rows as any[]) {
        const tableName = Object.values(row)[0];
        console.log(`- ${tableName}`);
      }
    }
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await connection.end();
  }
}

checkDatabase();
