// src/config/data-source.js
require('dotenv/config');
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DB_URL,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  synchronize: true,
  ssl: {
    rejectUnauthorized: false,
  },
  
});

module.exports = AppDataSource;
