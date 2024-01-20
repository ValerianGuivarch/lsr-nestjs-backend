import { Notification } from '../../models/elena/Notification'

export interface INotificationProvider {
  send(notification: Notification): Promise<void>
}
