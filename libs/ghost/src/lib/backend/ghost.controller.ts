import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { GhostService, SpiritAudioMessage } from './ghost.service'
import { ToolStateEntity } from './device.entity'
import { GameStateEntity } from './game-state.entity'
import { GameConfig } from './tools.types'

type LegacyDeviceState = ToolStateEntity & {
  deviceId: string
  role: string
}

@Controller('api')
export class GhostController {
  constructor(private readonly ghost: GhostService) {}

  private toLegacyDeviceState(tool: ToolStateEntity): LegacyDeviceState {
    const roleMap: Record<string, string> = {
      emf: 'emf',
      spiritbox: 'spiritbox',
      ghostcam: 'ghostcam',
      ghostorbs: 'ghostorbs',
      thermometer: 'thermometer',
      motion_sensor: 'emf',
      sound_detector: 'spiritbox',
      van: 'van',
      messagerie: 'messagerie'
    }

    return {
      ...tool,
      deviceId: tool.toolType,
      role: roleMap[tool.toolType] ?? 'emf'
    }
  }

  // Compat ancien dashboard détaillé
  @Get('admin/state')
  async getAdminStateCompat(): Promise<LegacyDeviceState[]> {
    const tools = await this.ghost.getToolStates()
    return tools.map(tool => this.toLegacyDeviceState(tool))
  }

  @Get('player/devices')
  async getPlayerDevicesCompat(): Promise<LegacyDeviceState[]> {
    return this.getAdminStateCompat()
  }

  @Get('player/state')
  async getPlayerStateCompat(
    @Query('deviceId') deviceId?: string
  ): Promise<LegacyDeviceState | LegacyDeviceState[] | undefined> {
    if (!deviceId) {
      return this.getAdminStateCompat()
    }
    const tool = await this.ghost.getToolState(deviceId)
    return tool ? this.toLegacyDeviceState(tool) : undefined
  }

  @Post('admin/reset')
  async resetCompat(): Promise<{ ok: true }> {
    await this.ghost.reset()
    return { ok: true }
  }

  @Post('admin/devices')
  async createDeviceCompat(
    @Body()
    payload: {
      deviceId: string
      role?: string
      emfLevel?: number
      powerOn?: boolean
      huntActive?: boolean
      message?: string
      cameraColor?: 'green' | 'red'
      ghostUntil?: string
      orbUntil?: string
      temperature?: number
      photoModeUnlocked?: boolean
    }
  ): Promise<LegacyDeviceState> {
    const tool = await this.ghost.setToolState(payload.deviceId, {
      emfLevel: payload.emfLevel,
      powerOn: payload.powerOn,
      huntActive: payload.huntActive,
      message: payload.message,
      cameraColor: payload.cameraColor,
      ghostUntil: payload.ghostUntil,
      orbUntil: payload.orbUntil,
      temperature: payload.temperature,
      photoModeUnlocked: payload.photoModeUnlocked,
    })
    return this.toLegacyDeviceState(tool)
  }

  @Patch('admin/device/:deviceId')
  async updateDeviceCompat(
    @Param('deviceId') deviceId: string,
    @Body() partial: Partial<ToolStateEntity>
  ): Promise<LegacyDeviceState> {
    const tool = await this.ghost.setToolState(deviceId, partial)
    return this.toLegacyDeviceState(tool)
  }

  @Delete('admin/device/:deviceId')
  async deleteDeviceCompat(@Param('deviceId') _deviceId: string): Promise<{ ok: true }> {
    // En mode outils hardcodés, on ne supprime pas réellement les entrées.
    return { ok: true }
  }

  @Post('admin/device/:deviceId/state')
  async setDeviceStateCompat(
    @Param('deviceId') deviceId: string,
    @Body() partial: Partial<ToolStateEntity>
  ): Promise<LegacyDeviceState> {
    const tool = await this.ghost.setToolState(deviceId, partial)
    return this.toLegacyDeviceState(tool)
  }

  @Post('admin/device/:deviceId/camera-frame')
  async setCameraFrameCompat(
    @Param('deviceId') deviceId: string,
    @Body('frame') frameBase64: string
  ): Promise<{ ok: true }> {
    this.ghost.setCameraFrame(deviceId, frameBase64)
    return { ok: true }
  }

  @Get('player/device/:deviceId/camera-frame')
  async getCameraFrameCompat(@Param('deviceId') deviceId: string): Promise<{ frame?: string }> {
    const frame = this.ghost.getCameraFrame(deviceId)
    return { frame }
  }

  @Post('player/device/:deviceId/spiritbox/player-message')
  async setSpiritPlayerMessageCompat(
    @Param('deviceId') deviceId: string,
    @Body() payload: { audioData: string; mimeType?: string }
  ): Promise<{ ok: true; message: SpiritAudioMessage }> {
    const message = this.ghost.setSpiritPlayerMessage(deviceId, payload.audioData, payload.mimeType)
    return { ok: true, message }
  }

  @Get('admin/device/:deviceId/spiritbox/player-message')
  async getSpiritPlayerMessageCompat(
    @Param('deviceId') deviceId: string
  ): Promise<{ message?: SpiritAudioMessage }> {
    return { message: this.ghost.getSpiritPlayerMessage(deviceId) }
  }

  @Post('admin/device/:deviceId/spiritbox/mj-message')
  async setSpiritMjMessageCompat(
    @Param('deviceId') deviceId: string,
    @Body() payload: { audioData: string; mimeType?: string }
  ): Promise<{ ok: true; message: SpiritAudioMessage }> {
    const message = this.ghost.setSpiritMjMessage(deviceId, payload.audioData, payload.mimeType)
    return { ok: true, message }
  }

  @Get('player/device/:deviceId/spiritbox/mj-message')
  async getSpiritMjMessageCompat(
    @Param('deviceId') deviceId: string
  ): Promise<{ message?: SpiritAudioMessage }> {
    return { message: this.ghost.getSpiritMjMessage(deviceId) }
  }

  @Patch('admin/device/:deviceId/van')
  async updateVanDataCompat(
    @Param('deviceId') _deviceId: string,
    @Body() partial: Partial<ToolStateEntity>
  ): Promise<LegacyDeviceState> {
    const tool = await this.ghost.updateVanData(partial)
    return this.toLegacyDeviceState(tool)
  }

  @Get('player/device/:deviceId/van')
  async getVanDataCompat(@Param('deviceId') deviceId: string): Promise<LegacyDeviceState | undefined> {
    const tool = await this.ghost.getToolState(deviceId)
    return tool ? this.toLegacyDeviceState(tool) : undefined
  }

  // ========== Outils (Hardcodés) ==========

  @Get('tools')
  async getToolStates(): Promise<ToolStateEntity[]> {
    return this.ghost.getToolStates()
  }

  @Get('tool/:toolType')
  async getToolState(@Param('toolType') toolType: string): Promise<ToolStateEntity | undefined> {
    return this.ghost.getToolState(toolType)
  }

  @Patch('admin/tool/:toolType')
  async setToolState(
    @Param('toolType') toolType: string,
    @Body() partial: Partial<ToolStateEntity>
  ): Promise<ToolStateEntity> {
    return this.ghost.setToolState(toolType, partial)
  }

  @Post('admin/tool/:toolType/camera-frame')
  async setCameraFrame(
    @Param('toolType') toolType: string,
    @Body('frame') frameBase64: string
  ): Promise<{ ok: true }> {
    this.ghost.setCameraFrame(toolType, frameBase64)
    return { ok: true }
  }

  @Get('tool/:toolType/camera-frame')
  async getCameraFrame(@Param('toolType') toolType: string): Promise<{ frame?: string }> {
    const frame = this.ghost.getCameraFrame(toolType)
    return { frame }
  }

  @Post('tool/:toolType/spiritbox/player-message')
  async setSpiritPlayerMessage(
    @Param('toolType') toolType: string,
    @Body() payload: { audioData: string; mimeType?: string }
  ): Promise<{ ok: true; message: SpiritAudioMessage }> {
    const message = this.ghost.setSpiritPlayerMessage(toolType, payload.audioData, payload.mimeType)
    return { ok: true, message }
  }

  @Get('admin/tool/:toolType/spiritbox/player-message')
  async getSpiritPlayerMessage(
    @Param('toolType') toolType: string
  ): Promise<{ message?: SpiritAudioMessage }> {
    return { message: this.ghost.getSpiritPlayerMessage(toolType) }
  }

  @Post('admin/tool/:toolType/spiritbox/mj-message')
  async setSpiritMjMessage(
    @Param('toolType') toolType: string,
    @Body() payload: { audioData: string; mimeType?: string }
  ): Promise<{ ok: true; message: SpiritAudioMessage }> {
    const message = this.ghost.setSpiritMjMessage(toolType, payload.audioData, payload.mimeType)
    return { ok: true, message }
  }

  @Get('tool/:toolType/spiritbox/mj-message')
  async getSpiritMjMessage(
    @Param('toolType') toolType: string
  ): Promise<{ message?: SpiritAudioMessage }> {
    return { message: this.ghost.getSpiritMjMessage(toolType) }
  }

  @Patch('admin/van')
  async updateVanData(
    @Body() partial: Partial<ToolStateEntity>
  ): Promise<ToolStateEntity> {
    return this.ghost.updateVanData(partial)
  }

  @Get('tool/van')
  async getVanData(): Promise<ToolStateEntity | undefined> {
    return this.ghost.getToolState('van')
  }

  // ========== Game State Management ==========

  @Post('admin/game/:gameId/init')
  async initGame(
    @Param('gameId') gameId: string,
    @Body() config: GameConfig
  ): Promise<GameStateEntity> {
    return this.ghost.initGame(gameId, config)
  }

  @Post('admin/game/:gameId/start')
  async startGame(@Param('gameId') gameId: string): Promise<GameStateEntity> {
    return this.ghost.startGame(gameId)
  }

  @Post('admin/game/:gameId/stop')
  async stopGame(@Param('gameId') gameId: string): Promise<GameStateEntity> {
    return this.ghost.stopGame(gameId)
  }

  @Get('game/:gameId')
  async getGameState(@Param('gameId') gameId: string): Promise<GameStateEntity | null> {
    return this.ghost.getGameState(gameId)
  }

  @Post('admin/game/:gameId/advance-step')
  async advanceScenarioStep(@Param('gameId') gameId: string): Promise<GameStateEntity> {
    return this.ghost.advanceScenarioStep(gameId)
  }

  @Patch('admin/game/:gameId/objectives')
  async updateScenarioObjectives(
    @Param('gameId') gameId: string,
    @Body('objectives') objectives: Record<string, boolean>
  ): Promise<GameStateEntity> {
    return this.ghost.updateScenarioObjectives(gameId, objectives)
  }
}
