import { ISmsProvider } from '../../domain/providers/ISmsProvider'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Twilio } from 'twilio'

@Injectable()
export class TwilioProvider implements ISmsProvider {
  private twilio
  private messagingService: string

  constructor(configService: ConfigService) {
    this.twilio = new Twilio(
      configService.get<string>('TWILIO_ACCOUNT_SID'),
      configService.get<string>('TWILIO_AUTH_TOKEN')
    )
    this.messagingService = configService.get<string>('TWILIO_MESSAGING_SERVICE')
    console.log('TwilioProvider')
  }

  send(phone: string, text: string): Promise<void> {
    return this.twilio.messages.create({
      messagingServiceSid: this.messagingService,
      to: '+' + phone,
      body: text
    })
  }
}
