import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { Client, ChannelType, ThreadAutoArchiveDuration } from 'discord.js'

export type RequestStatus = 'requested' | 'in_progress' | 'review' | 'done'
export type Pf2Request = {
  id: number
  title: string
  description: string
  requester_id: string
  requester_name: string
  created_by: string
  status: RequestStatus
  channel_id: string
  message_id: string
  thread_id: string
  image_url: string | null
}

const CHANNEL_ID = '1554492543654436875'
export const REQUEST_STATES: Record<RequestStatus, string> = {
  requested: 'Demandé',
  in_progress: 'En cours',
  review: 'À valider',
  done: 'Terminé',
}

@Injectable()
export class Pf2RequestService implements OnModuleInit {
  private readonly logger = new Logger(Pf2RequestService.name)

  constructor(@InjectDataSource('pf2-sqlite') private readonly db: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.db.query(`CREATE TABLE IF NOT EXISTS pf2_request (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL,
      requester_id TEXT NOT NULL, requester_name TEXT NOT NULL, created_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'requested', channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL DEFAULT '', thread_id TEXT NOT NULL DEFAULT '',
      image_url TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)
  }

  async list(): Promise<Pf2Request[]> {
    return this.db.query('SELECT * FROM pf2_request ORDER BY id DESC')
  }

  async byThread(threadId: string): Promise<Pf2Request | null> {
    return (await this.db.query('SELECT * FROM pf2_request WHERE thread_id = ? LIMIT 1', [threadId]))[0] ?? null
  }

  async byId(id: number): Promise<Pf2Request | null> {
    return (await this.db.query('SELECT * FROM pf2_request WHERE id = ? LIMIT 1', [id]))[0] ?? null
  }

  format(item: Pf2Request): string {
    return `**Requête #${item.id} — ${REQUEST_STATES[item.status]}**\n**${item.title}**\nDemandée par : <@${item.requester_id}> (${item.requester_name})\n\n${item.description}${item.image_url ? '\n\nImage : ' + item.image_url : ''}`
  }

  async create(client: Client, data: {
    title: string
    description: string
    requesterId: string
    requesterName: string
    createdBy: string
    imageUrl?: string
  }): Promise<Pf2Request> {
    const channel = await client.channels.fetch(CHANNEL_ID)
    if (!channel || channel.type !== ChannelType.GuildText) throw new Error('Salon bot-et-app inaccessible')
    await this.db.query(
      'INSERT INTO pf2_request (title,description,requester_id,requester_name,created_by,status,channel_id,image_url) VALUES (?,?,?,?,?,?,?,?)',
      [data.title, data.description, data.requesterId, data.requesterName, data.createdBy, 'requested', CHANNEL_ID, data.imageUrl || null],
    )
    const id = Number((await this.db.query('SELECT last_insert_rowid() AS id'))[0].id)
    const item = await this.byId(id)
    if (!item) throw new Error('Requête introuvable après insertion')
    const msg = await channel.send({ content: this.format(item), allowedMentions: { parse: [] } })
    const thread = await msg.startThread({
      name: `#${id} — ${data.title}`.slice(0, 100),
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    })
    await this.db.query('UPDATE pf2_request SET message_id=?,thread_id=? WHERE id=?', [msg.id, thread.id, id])
    try {
      await msg.pin()
    } catch (error) {
      // MANAGE_MESSAGES is optional. Never discard a created request for a pin.
      this.logger.warn(`Requête #${id} : épinglage refusé : ${String(error)}`)
    }
    return (await this.byId(id))!
  }

  async change(client: Client | null, id: number, status: RequestStatus): Promise<Pf2Request> {
    if (!(status in REQUEST_STATES)) throw new Error('État inconnu')
    const item = await this.byId(id)
    if (!item) throw new Error('Requête inconnue')

    const changed = item.status !== status
    if (changed) {
      // SQLite is the canonical state for the Kanban. A missing Discord
      // permission (especially unpin's MANAGE_MESSAGES) must never prevent
      // this state transition or make the wiki report a false failure.
      await this.db.query('UPDATE pf2_request SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, id])
    }
    const updated = { ...item, status }
    if (!client) {
      this.logger.warn(`Requête #${id} enregistrée en SQLite ; bot Discord indisponible.`)
      return updated
    }

    // Discord is a best-effort projection of the persisted state. Even a
    // repeated status request retries a previous failed message edit/pin,
    // without creating another status announcement in its discussion.
    try {
      const channel = await client.channels.fetch(item.channel_id)
      if (!channel || channel.type !== ChannelType.GuildText) throw new Error('Salon introuvable')
      if (item.message_id) {
        const message = await channel.messages.fetch(item.message_id)
        await message.edit({ content: this.format(updated), allowedMentions: { parse: [] } })
        try {
          if (status === 'done' && message.pinned) await message.unpin()
          else if (status !== 'done' && !message.pinned) await message.pin()
        } catch (error) {
          this.logger.warn(`Requête #${id} : épinglage/désépinglage impossible (statut conservé) : ${String(error)}`)
        }
      }
    } catch (error) {
      this.logger.warn(`Requête #${id} : message Discord non synchronisé (statut conservé) : ${String(error)}`)
    }

    if (changed && item.thread_id) {
      try {
        const thread = await client.channels.fetch(item.thread_id)
        if (thread?.isThread()) {
          if (thread.archived) await thread.setArchived(false)
          await thread.send({
            content: `Requête #${id} : **${REQUEST_STATES[status]}**.`,
            allowedMentions: { parse: [] },
          })
        }
      } catch (error) {
        this.logger.warn(`Requête #${id} : notification du fil impossible (statut conservé) : ${String(error)}`)
      }
    }
    return updated
  }
}
