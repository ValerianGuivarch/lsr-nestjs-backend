import { DiaryService } from './DiaryService'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

export interface DiaryNotificationResult {
  success: boolean
  missingCount: number
  message: string
}

@Injectable()
export class DiaryNotificationService {
  private readonly logger = new Logger(DiaryNotificationService.name)

  constructor(
    private readonly diaryService: DiaryService,
    private readonly configService: ConfigService
  ) {}

  async sendReminder(): Promise<DiaryNotificationResult> {
    const topic = this.configService.get<string>('notifications.ntfyTopic')
    const baseUrl = this.configService.get<string>('notifications.ntfyUrl') || 'https://ntfy.sh'
    const token = this.configService.get<string>('notifications.ntfyToken')
    const frontendUrl = this.configService.get<string>('cors.frontend') || ''

    if (!topic) {
      return {
        success: false,
        missingCount: 0,
        message: 'NTFY_TOPIC is not configured'
      }
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const missingEntries = await this.diaryService.findAllMissingEntries()
    const currentYearMissingEntries = missingEntries.filter((entry) => entry.year === currentYear)
    const missingCount = currentYearMissingEntries.length

    const message =
      missingCount === 0
        ? 'Year Diary est à jour : aucun jour en retard.'
        : `Year Diary : ${missingCount} jour${missingCount > 1 ? 's' : ''} en retard.`

    const url = `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(topic)}`
    const headers: Record<string, string> = {
      Title: 'Year Diary',
      Tags: 'ledger'
    }

    if (frontendUrl) {
      headers.Click = `${frontendUrl.replace(/\/$/, '')}/diary`
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    try {
      await axios.post(url, message, { headers })
      return { success: true, missingCount, message }
    } catch (error) {
      const reason = axios.isAxiosError(error)
        ? error.response?.data || error.message
        : error instanceof Error
          ? error.message
          : String(error)

      this.logger.error(`Unable to send Year Diary notification: ${reason}`)
      return {
        success: false,
        missingCount,
        message: `Notification failed: ${reason}`
      }
    }
  }
}
