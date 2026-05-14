import { Controller, Get } from '@nestjs/common'
import { join } from 'path'
import { readdirSync } from 'fs'

@Controller('api/music')
export class MusicController {
  @Get('sounds')
  getSounds(): { files: string[] } {
    const dir = join(process.cwd(), 'music', 'sounds')
    let files: string[] = []
    try {
      files = readdirSync(dir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.ogg'))
    } catch (e) {
      files = []
    }
    return { files }
  }

  @Get('voices')
  getVoices(): { files: string[] } {
    const dir = join(process.cwd(), 'music', 'voices')
    let files: string[] = []
    try {
      files = readdirSync(dir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.ogg'))
    } catch (e) {
      files = []
    }
    return { files }
  }
}
