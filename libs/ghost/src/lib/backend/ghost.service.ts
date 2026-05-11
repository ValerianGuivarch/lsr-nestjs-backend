import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DeviceEntity } from './device.entity'

export type DeviceRole = 'emf' | 'spiritbox' | 'ghostcam' | 'ghostorbs' | 'van'

export type SpiritAudioMessage = {
  id: string
  audioData: string
  mimeType?: string
  from: 'player' | 'mj'
  createdAt: string
}

@Injectable()
export class GhostService {
  private frameBuffer = new Map<string, string>()
  private spiritPlayerToMjBuffer = new Map<string, SpiritAudioMessage>()
  private spiritMjToPlayerBuffer = new Map<string, SpiritAudioMessage>()

  constructor(
    @InjectRepository(DeviceEntity)
    private readonly repo: Repository<DeviceEntity>
  ) {}

  async getDevices(): Promise<DeviceEntity[]> {
    return this.repo.find()
  }

  async createDevice(payload: {
    deviceId: string
    role?: DeviceRole
    emfLevel?: number
    powerOn?: boolean
    huntActive?: boolean
    message?: string
    cameraColor?: 'green' | 'red'
    ghostUntil?: string
  }): Promise<DeviceEntity> {
    const existing = await this.repo.findOneBy({ deviceId: payload.deviceId })

    if (existing) {
      throw new BadRequestException(`Device ${payload.deviceId} already exists`)
    }

    const now = new Date().toISOString()

    return this.repo.save(
      this.repo.create({
        deviceId: payload.deviceId,
        role: payload.role ?? 'emf',
        emfLevel: payload.emfLevel,
        powerOn: payload.powerOn ?? true,
        huntActive: payload.huntActive ?? false,
        message: payload.message,
        cameraColor: payload.cameraColor ?? 'green',
        ghostUntil: payload.ghostUntil,
        updatedAt: now
      })
    )
  }

  async getDeviceState(deviceId: string): Promise<DeviceEntity | undefined> {
    return this.repo.findOneBy({ deviceId })
  }

  async setDeviceState(deviceId: string, partial: Partial<DeviceEntity>): Promise<DeviceEntity> {
    let device = await this.repo.findOneBy({ deviceId })
    const now = new Date().toISOString()
    if (!device) {
      device = this.repo.create({
        deviceId,
        role: 'emf',
        powerOn: true,
        huntActive: false,
        cameraColor: 'green',
        updatedAt: now
      })
    }
    Object.assign(device, partial, { deviceId, updatedAt: now })
    return this.repo.save(device)
  }

  async setDeviceRole(deviceId: string, role: DeviceRole): Promise<DeviceEntity> {
    return this.setDeviceState(deviceId, { role })
  }

  async updateDevice(
    deviceId: string,
    partial: Partial<Pick<DeviceEntity, 'role' | 'emfLevel' | 'powerOn' | 'huntActive' | 'message' | 'cameraColor' | 'ghostUntil'>>
  ): Promise<DeviceEntity> {
    const existing = await this.repo.findOneBy({ deviceId })

    if (!existing) {
      throw new NotFoundException(`Device ${deviceId} not found`)
    }

    Object.assign(existing, partial, { updatedAt: new Date().toISOString() })
    return this.repo.save(existing)
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.repo.delete({ deviceId })
  }

  async reset(): Promise<void> {
    await this.repo.clear()
    this.frameBuffer.clear()
    this.spiritPlayerToMjBuffer.clear()
    this.spiritMjToPlayerBuffer.clear()
  }

  setCameraFrame(deviceId: string, frameBase64: string): void {
    this.frameBuffer.set(deviceId, frameBase64)
  }

  getCameraFrame(deviceId: string): string | undefined {
    return this.frameBuffer.get(deviceId)
  }

  setSpiritPlayerMessage(deviceId: string, audioData: string, mimeType?: string): SpiritAudioMessage {
    const message: SpiritAudioMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      audioData,
      mimeType,
      from: 'player',
      createdAt: new Date().toISOString()
    }
    this.spiritPlayerToMjBuffer.set(deviceId, message)
    return message
  }

  getSpiritPlayerMessage(deviceId: string): SpiritAudioMessage | undefined {
    return this.spiritPlayerToMjBuffer.get(deviceId)
  }

  setSpiritMjMessage(deviceId: string, audioData: string, mimeType?: string): SpiritAudioMessage {
    const message: SpiritAudioMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      audioData,
      mimeType,
      from: 'mj',
      createdAt: new Date().toISOString()
    }
    this.spiritMjToPlayerBuffer.set(deviceId, message)
    return message
  }

  getSpiritMjMessage(deviceId: string): SpiritAudioMessage | undefined {
    return this.spiritMjToPlayerBuffer.get(deviceId)
  }

  async updateVanData(
    deviceId: string,
    partial: Partial<
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
      >
    >
  ): Promise<DeviceEntity> {
    const existing = await this.repo.findOneBy({ deviceId })

    if (!existing) {
      throw new NotFoundException(`Device ${deviceId} not found`)
    }

    Object.assign(existing, partial, { updatedAt: new Date().toISOString() })
    return this.repo.save(existing)
  }
}
