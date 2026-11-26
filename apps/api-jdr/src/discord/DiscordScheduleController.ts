import { randomBytes } from 'node:crypto'
import {
  Body, Controller, Get, Headers, HttpException, HttpStatus, Param, Post, Res,
} from '@nestjs/common'
import type { FastifyReply } from 'fastify'
import { DiscordCommandsService } from './DiscordCommandsService'
import { discordScheduleHtml } from './DiscordSchedulePage'

/**
 * Short-lived, unguessable bearer links are issued ONLY after the /analyse-date-seance
 * Discord command passes its admin check. No key is put in cookies or storage.
 * Pages never expose the token to analytics, third-party requests or referrers.
 */
@Controller(['api/pf2-mj/discord/analyse-date-seance', 'api/v1/pf2-mj/discord/analyse-date-seance'])
export class DiscordScheduleController {
  constructor(private readonly commands: DiscordCommandsService) {}

  private run<T>(callback: () => T): T {
    try {
      return callback()
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Formulaire refusé.',HttpStatus.BAD_REQUEST)
    }
  }

  private async runAsync<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await callback()
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Publication refusée.',HttpStatus.CONFLICT)
    }
  }

  private assertOrigin(origin: string): void {
    // A bearer token is required regardless of Origin; this further blocks
    // cross-origin scripted submissions when using the browser workflow.
    const allowed = (process.env['PF2_FIN_SEANCE_PUBLIC_ORIGIN']?.trim() || 'https://l7r.fr').replace(/\/$/,'')
    if (origin && origin !== allowed && !/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin)) {
      throw new HttpException('Origine de requête non autorisée.',HttpStatus.FORBIDDEN)
    }
  }

  @Get(':token')
  html(@Param('token') token: string, @Res() reply: FastifyReply): FastifyReply {
    this.run(() => this.commands.scheduleWebState(token))
    const nonce = randomBytes(18).toString('base64')
    reply.header('Cache-Control','private, no-store, max-age=0')
    reply.header('Referrer-Policy','no-referrer')
    reply.header('X-Content-Type-Options','nosniff')
    reply.header('X-Frame-Options','DENY')
    reply.header('Content-Security-Policy',
      "default-src 'none'; script-src 'nonce-"+nonce+
      "'; style-src 'nonce-"+nonce+
      "'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
    return reply.type('text/html; charset=utf-8').send(discordScheduleHtml(nonce))
  }

  @Get(':token/state')
  state(@Param('token') token: string, @Res({passthrough:true}) reply: FastifyReply): Record<string,unknown> {
    reply.header('Cache-Control','private, no-store, max-age=0')
    reply.header('Referrer-Policy','no-referrer')
    return this.run(() => this.commands.scheduleWebState(token))
  }

  @Post(':token/options')
  options(@Param('token') token:string,@Body() body:unknown,@Headers('origin') origin='') {
    this.assertOrigin(origin)
    return this.run(()=>this.commands.scheduleWebOptions(token,body))
  }

  @Post(':token/choose')
  choose(@Param('token') token:string,@Body() body:unknown,@Headers('origin') origin='') {
    this.assertOrigin(origin)
    return this.run(()=>this.commands.scheduleWebChoose(token,body))
  }

  @Post(':token/confirm')
  confirm(@Param('token') token:string,@Body() body:unknown,@Headers('origin') origin='') {
    this.assertOrigin(origin)
    if(!body || (body as {confirm?:boolean}).confirm!==true) throw new HttpException('Confirmation explicite requise.',HttpStatus.BAD_REQUEST)
    return this.runAsync(()=>this.commands.scheduleWebConfirm(token,body))
  }
}
