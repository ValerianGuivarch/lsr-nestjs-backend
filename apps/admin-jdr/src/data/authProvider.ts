import { AuthProvider } from 'react-admin'

// The admin app itself is gated by Basic Auth at the dev/preview server level (see
// basic-auth.plugin.mts), so react-admin's own auth layer is a no-op: reaching this app at all
// already means the browser presented valid credentials.
export const authProvider: AuthProvider = {
  async login() {
    return undefined
  },
  async logout() {
    return undefined
  },
  async checkAuth() {
    return undefined
  },
  async checkError() {
    return undefined
  },
  async getPermissions() {
    return undefined
  }
}
