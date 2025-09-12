import { Notification } from '../../domain/models/elena/Notification'
import { INotificationProvider } from '../../domain/providers/elena/INotificationProvider'
import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class FBNotificationProvider implements INotificationProvider {
  async send(notification: Notification): Promise<void> {
    try {
      // Configuration de l'en-tête et du corps de la requête
      const headers = {
        'Content-Type': 'application/json'
      }
      // Corps de la requête selon la documentation de Firebase Cloud Messaging
      const body = {
        topic: 'events', // ou un topic spécifique ou un token d'inscription pour des utilisateurs spécifiques
        notification: {
          title: notification.titre,
          text: notification.text,
          image: notification.pictureUrl
        }
      }

      //console.log('Sending notification:', body)
      // Appel à Firebase Cloud Messaging API
      const response = await axios.post(
        'https://us-central1-elena-evjf.cloudfunctions.net/sendNotificationOnEvent',
        body,
        {
          headers
        }
      )
      //console.log('Notification sent successfully:', response.data)
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }
}
