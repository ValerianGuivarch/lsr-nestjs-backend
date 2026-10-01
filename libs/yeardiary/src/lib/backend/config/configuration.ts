/* eslint-disable no-process-env,no-magic-numbers */
import { env } from 'process'

export default () => ({
  port: parseInt(env.YEARDIARY_PORT || env.PORT || '8080', 10),
  http: {
    host: env.HOST || '0.0.0.0',
    port: parseInt(env.YEARDIARY_PORT || env.PORT || '8080', 10)
  },
  sqlite: {
    database: env.YEARDIARY_SQLITE_DATABASE || 'database.sqlite',
    autoLoadEntities: true
  },
  cors: {
    frontend: env.FRONTEND_URL || 'http://127.0.0.1:3000'
  },
  notifications: {
    ntfyUrl: env.NTFY_URL || 'https://ntfy.sh',
    ntfyTopic: env.NTFY_TOPIC || '',
    ntfyToken: env.NTFY_TOKEN || '',
    reminderTime: env.DIARY_REMINDER_TIME || '09:15',
    timeZone: env.DIARY_REMINDER_TIME_ZONE || 'Europe/Paris'
  }
})
