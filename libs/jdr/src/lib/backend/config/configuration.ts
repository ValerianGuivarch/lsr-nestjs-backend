/* eslint-disable no-process-env */
// eslint-disable-next-line import/no-default-export
export default () => ({
  http: {
    host: process.env['HOST'] || '0.0.0.0',
    port: parseInt(process.env['JDR_PORT'] || '3003')
  },
})
