import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { GhostService, DeviceRole, SpiritAudioMessage } from './ghost.service'
import { DeviceEntity } from './device.entity'

@Controller('api')
export class GhostController {
  constructor(private readonly ghost: GhostService) {}

  @Get('player/devices')
  async getDevices(): Promise<DeviceEntity[]> {
    return this.ghost.getDevices()
  }

  @Get('player/state')
  async getPlayerState(@Query('deviceId') deviceId: string): Promise<DeviceEntity | undefined> {
    return this.ghost.getDeviceState(deviceId)
  }

  @Get('admin/state')
  async getAdminState(): Promise<DeviceEntity[]> {
    return this.ghost.getDevices()
  }

  @Post('admin/devices')
  async createDevice(
    @Body()
    payload: {
      deviceId: string
      role?: DeviceRole
      emfLevel?: number
      powerOn?: boolean
      huntActive?: boolean
      message?: string
      cameraColor?: 'green' | 'red'
      ghostUntil?: string
    }
  ): Promise<DeviceEntity> {
    return this.ghost.createDevice(payload)
  }

  @Patch('admin/device/:deviceId')
  async updateDevice(
    @Param('deviceId') deviceId: string,
    @Body() partial: Partial<Pick<DeviceEntity, 'role' | 'emfLevel' | 'powerOn' | 'huntActive' | 'message' | 'cameraColor' | 'ghostUntil'>>
  ): Promise<DeviceEntity> {
    return this.ghost.updateDevice(deviceId, partial)
  }

  @Delete('admin/device/:deviceId')
  async deleteDevice(@Param('deviceId') deviceId: string): Promise<{ ok: true }> {
    await this.ghost.deleteDevice(deviceId)
    return { ok: true }
  }

  @Post('admin/device/:deviceId/state')
  async setDeviceState(
    @Param('deviceId') deviceId: string,
    @Body() partial: Partial<DeviceEntity>
  ): Promise<DeviceEntity> {
    return this.ghost.setDeviceState(deviceId, partial)
  }

  @Post('admin/device/:deviceId/role')
  async setDeviceRole(
    @Param('deviceId') deviceId: string,
    @Body('role') role: DeviceRole
  ): Promise<DeviceEntity> {
    return this.ghost.setDeviceRole(deviceId, role)
  }

  @Post('admin/reset')
  async reset(): Promise<{ ok: true }> {
    await this.ghost.reset()
    return { ok: true }
  }

  @Post('admin/device/:deviceId/camera-frame')
  async setCameraFrame(
    @Param('deviceId') deviceId: string,
    @Body('frame') frameBase64: string
  ): Promise<{ ok: true }> {
    this.ghost.setCameraFrame(deviceId, frameBase64)
    return { ok: true }
  }

  @Get('player/device/:deviceId/camera-frame')
  async getCameraFrame(@Param('deviceId') deviceId: string): Promise<{ frame?: string }> {
    const frame = this.ghost.getCameraFrame(deviceId)
    return { frame }
  }

  @Post('player/device/:deviceId/spiritbox/player-message')
  async setSpiritPlayerMessage(
    @Param('deviceId') deviceId: string,
    @Body() payload: { audioData: string; mimeType?: string }
  ): Promise<{ ok: true; message: SpiritAudioMessage }> {
    const message = this.ghost.setSpiritPlayerMessage(deviceId, payload.audioData, payload.mimeType)
    return { ok: true, message }
  }

  @Get('admin/device/:deviceId/spiritbox/player-message')
  async getSpiritPlayerMessage(
    @Param('deviceId') deviceId: string
  ): Promise<{ message?: SpiritAudioMessage }> {
    return { message: this.ghost.getSpiritPlayerMessage(deviceId) }
  }

  @Post('admin/device/:deviceId/spiritbox/mj-message')
  async setSpiritMjMessage(
    @Param('deviceId') deviceId: string,
    @Body() payload: { audioData: string; mimeType?: string }
  ): Promise<{ ok: true; message: SpiritAudioMessage }> {
    const message = this.ghost.setSpiritMjMessage(deviceId, payload.audioData, payload.mimeType)
    return { ok: true, message }
  }

  @Get('player/device/:deviceId/spiritbox/mj-message')
  async getSpiritMjMessage(
    @Param('deviceId') deviceId: string
  ): Promise<{ message?: SpiritAudioMessage }> {
    return { message: this.ghost.getSpiritMjMessage(deviceId) }
  }

  @Patch('admin/device/:deviceId/van')
  async updateVanData(
    @Param('deviceId') deviceId: string,
    @Body() partial: Partial<
      Pick<
        DeviceEntity,
        | 'ghostActivityLevel'
        | 'playerSanity'
        | 'soundLevels'
        | 'motionDetections'
        | 'roomList'
        | 'motionSensorRooms'
        | 'recentMotionAlert'
        | 'missionObjectives'
        | 'floorPlanImage'
        | 'backgroundMusic'
        | 'soundboard'
      >
    >
  ): Promise<DeviceEntity> {
    return this.ghost.updateVanData(deviceId, partial)
  }

  @Get('player/device/:deviceId/van')
  async getVanData(@Param('deviceId') deviceId: string): Promise<DeviceEntity | undefined> {
    return this.ghost.getDeviceState(deviceId)
  }
}
