export interface ISmsProvider {
  send(phone: string, text: string): Promise<void>
}
