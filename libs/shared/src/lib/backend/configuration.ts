/* eslint-disable no-process-env */
// eslint-disable-next-line import/no-default-export
export default () => ({
  apiUrl: process.env['API_URL'],
  http: {
    host: process.env['HOST'] || '0.0.0.0',
    port: parseInt(process.env['PORT'] || '3000')
  },
  JwtService: {
    jwtSecret: process.env['JWT_SECRET']
  },
  management: process.env['MANAGEMENT'],
  mailjet: {
    emailFrom: process.env['EMAIL_FROM'],
    emailFromName: process.env['EMAIL_FROM_NAME'],
    apiKey: process.env['MAILJET_API_KEY'],
    apiKeySecret: process.env['MAILJET_API_SECRET']
  },
  prismic: {
    uri: process.env['PRISMIC_URI'],
    accessToken: process.env['PRISMIC_TOKEN'],
    release: process.env['PRISMIC_RELEASE'],
    webhook: {
      url: process.env['PRISMIC_WEBHOOK_API_URL'],
      secret: process.env['PRISMIC_WEBHOOK_SECRET_TOKEN']
    }
  },
  cloudinary: {
    cloudName: process.env['CLOUDINARY_CLOUD_NAME'],
    apiKey: process.env['CLOUDINARY_API_KEY'],
    apiSecret: process.env['CLOUDINARY_API_SECRET']
  }
})