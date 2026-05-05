/* eslint-disable no-process-env */
// eslint-disable-next-line import/no-default-export
export default () => ({
  http: {
    host: process.env['HOST'] || '0.0.0.0',
    port: parseInt(process.env['JDR_PORT'] || '3003')
  },
  postgres: {
    host: process.env['DB_HOST'] || '127.0.0.1',
    port: process.env['DB_PORT'] ? parseInt(process.env['DB_PORT']) : 5433,
    username: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'postgres',
    database: process.env['DB_NAME'] || 'starter-database',
    autoLoadEntities: true,
    synchronize: true
  }
})
