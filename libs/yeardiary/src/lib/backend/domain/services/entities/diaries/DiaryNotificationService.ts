import { DiaryService } from './DiaryService'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

export interface DiaryNotificationResult {
  success: boolean
  missingCount: number
  message: string
  severity?: 'normal' | 'alert' | 'urgent'
  oldestMissingDate?: string | null
}

type MissingEntry = { day: number; month: number; year: number }

@Injectable()
export class DiaryNotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiaryNotificationService.name)
  private scheduler?: NodeJS.Timeout
  private lastAutomaticRun = ''

  constructor(
    private readonly diaryService: DiaryService,
    private readonly configService: ConfigService
  ) {}

  onModuleInit(): void {
    this.scheduler = setInterval(() => void this.runScheduledReminder(), 30_000)
    this.scheduler.unref?.()
    void this.runScheduledReminder()
  }

  onModuleDestroy(): void {
    if (this.scheduler) clearInterval(this.scheduler)
  }

  private async runScheduledReminder(now = new Date()): Promise<void> {
    const timeZone = this.configService.get<string>('notifications.timeZone') || 'Europe/Paris'
    const scheduledTime = this.configService.get<string>('notifications.reminderTime') || '09:15'
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(now)
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
    const dateKey = `${get('year')}-${get('month')}-${get('day')}`
    const time = `${get('hour')}:${get('minute')}`

    if (time !== scheduledTime || this.lastAutomaticRun === dateKey) return
    this.lastAutomaticRun = dateKey

    const result = await this.sendReminder(now)
    if (result.success) this.logger.log(`Scheduled Year Diary reminder sent (${result.missingCount} missing).`)
    else this.logger.error(`Scheduled Year Diary reminder failed: ${result.message}`)
  }

  async sendReminder(now = new Date()): Promise<DiaryNotificationResult> {
    const topic = this.configService.get<string>('notifications.ntfyTopic')
    const baseUrl = this.configService.get<string>('notifications.ntfyUrl') || 'https://ntfy.sh'
    const token = this.configService.get<string>('notifications.ntfyToken')
    const frontendUrl = this.configService.get<string>('cors.frontend') || ''
    const timeZone = this.configService.get<string>('notifications.timeZone') || 'Europe/Paris'

    if (!topic) {
      return { success: false, missingCount: 0, message: 'NTFY_TOPIC is not configured' }
    }

    const localDate = this.localDateParts(now, timeZone)
    const missingEntries = await this.diaryService.findAllMissingEntries()
    const currentYearMissingEntries = missingEntries
      .filter((entry) => entry.year === localDate.year)
      .sort((left, right) => this.entryTimestamp(left) - this.entryTimestamp(right))
    const reminder = this.buildReminder(currentYearMissingEntries, localDate)

    const url = `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(topic)}`
    const headers: Record<string, string> = {
      Title: reminder.title,
      Tags: reminder.tags,
      Priority: String(reminder.priority)
    }

    if (frontendUrl) headers.Click = `${frontendUrl.replace(/\/$/, '')}/diary`
    if (token) headers.Authorization = `Bearer ${token}`

    try {
      await axios.post(url, reminder.message, { headers })
      return {
        success: true,
        missingCount: currentYearMissingEntries.length,
        message: reminder.message,
        severity: reminder.severity,
        oldestMissingDate: reminder.oldest ? this.isoDate(reminder.oldest) : null
      }
    } catch (error) {
      const reason = axios.isAxiosError(error)
        ? error.response?.data || error.message
        : error instanceof Error
          ? error.message
          : String(error)
      this.logger.error(`Unable to send Year Diary notification: ${reason}`)
      return {
        success: false,
        missingCount: currentYearMissingEntries.length,
        message: `Notification failed: ${reason}`,
        severity: reminder.severity,
        oldestMissingDate: reminder.oldest ? this.isoDate(reminder.oldest) : null
      }
    }
  }

  private buildReminder(
    entries: MissingEntry[],
    today: MissingEntry
  ): {
    title: string
    message: string
    severity: 'normal' | 'alert' | 'urgent'
    priority: number
    tags: string
    oldest: MissingEntry | null
  } {
    const count = entries.length
    if (!count) {
      return {
        title: 'Year Diary',
        message: 'Tout est à jour : aucun jour en retard.',
        severity: 'normal',
        priority: 3,
        tags: 'ledger,white_check_mark',
        oldest: null
      }
    }

    const oldest = entries[0]
    const ageDays = Math.max(0, Math.floor((this.entryTimestamp(today) - this.entryTimestamp(oldest)) / 86_400_000))
    const urgent = count >= 5 || ageDays > 5
    const alert = !urgent && count >= 3
    const severity = urgent ? 'urgent' : alert ? 'alert' : 'normal'
    const prefix = urgent ? '🚨 ALERTE — ' : alert ? '🔴 ' : ''
    const oldestLabel = this.formatEntryDate(oldest)
    const message = `${prefix}${count} jour${count > 1 ? 's' : ''} en retard. Plus ancien : ${oldestLabel} (${ageDays} jour${ageDays > 1 ? 's' : ''}).`

    return {
      title: urgent ? '🚨 Year Diary — retard important' : alert ? '🔴 Year Diary' : 'Year Diary',
      message,
      severity,
      priority: urgent ? 5 : alert ? 4 : 3,
      tags: urgent ? 'rotating_light,warning' : alert ? 'red_circle,warning' : 'ledger',
      oldest
    }
  }

  private localDateParts(date: Date, timeZone: string): MissingEntry {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date)
    const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0)
    return { year: get('year'), month: get('month'), day: get('day') }
  }

  private entryTimestamp(entry: MissingEntry): number {
    return Date.UTC(entry.year, entry.month - 1, entry.day)
  }
  private isoDate(entry: MissingEntry): string {
    return `${entry.year}-${String(entry.month).padStart(2, '0')}-${String(entry.day).padStart(2, '0')}`
  }
  private formatEntryDate(entry: MissingEntry): string {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(this.entryTimestamp(entry))
    )
  }
}
