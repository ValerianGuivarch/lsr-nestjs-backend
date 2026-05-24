import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ToolStateEntity } from './device.entity'
import { GameStateEntity } from './game-state.entity'
import { GameConfig, ToolType } from './tools.types'

export type DeviceRole = 'emf' | 'spiritbox' | 'ghostcam' | 'ghostorbs' | 'van' | 'messagerie'

export type SpiritAudioMessage = {
  id: string
  audioData: string
  mimeType?: string
  from: 'player' | 'mj'
  createdAt: string
}

const CANONICAL_TOOL_TYPES: ToolType[] = [
  ToolType.EMF,
  ToolType.SPIRITBOX,
  ToolType.GHOSTCAM,
  ToolType.THERMOMETER,
  ToolType.VAN,
  ToolType.MESSAGERIE
]

@Injectable()
export class GhostService {
  private frameBuffer = new Map<string, string>()
  private spiritPlayerToMjBuffer = new Map<string, SpiritAudioMessage>()
  private spiritMjToPlayerBuffer = new Map<string, SpiritAudioMessage>()
  private accelerationIntervals = new Map<string, NodeJS.Timeout>()

  constructor(
    @InjectRepository(ToolStateEntity, 'ghost')
    private readonly toolStateRepo: Repository<ToolStateEntity>,
    @InjectRepository(GameStateEntity, 'ghost')
    private readonly gameStateRepo: Repository<GameStateEntity>
  ) {}

  async getToolStates(): Promise<ToolStateEntity[]> {
    const states = await this.toolStateRepo.find()
    const visibleStates = states.filter(state => CANONICAL_TOOL_TYPES.includes(state.toolType as ToolType))
    // Créer les états par défaut pour les outils manquants
    const missingTools = CANONICAL_TOOL_TYPES.filter(
      toolType => !visibleStates.some(s => s.toolType === toolType)
    )
    if (missingTools.length > 0) {
      const now = new Date().toISOString()
      const newTools = missingTools.map(toolType =>
        this.toolStateRepo.create({
          toolType,
          powerOn: true,
          huntActive: false,
          cameraColor: 'green',
          temperature: 20,
          updatedAt: now
        })
      )
      await this.toolStateRepo.save(newTools)
      visibleStates.push(...newTools)
    }
    return visibleStates
  }

  async getToolState(toolType: string): Promise<ToolStateEntity | undefined> {
    let tool = await this.toolStateRepo.findOneBy({ toolType })
    if (!tool) {
      const now = new Date().toISOString()
      tool = await this.toolStateRepo.save(
        this.toolStateRepo.create({
          toolType,
          powerOn: true,
          huntActive: false,
          cameraColor: 'green',
          temperature: 20,
          updatedAt: now
        })
      )
    }
    return tool
  }

  async setToolState(toolType: string, partial: Partial<ToolStateEntity>): Promise<ToolStateEntity> {
    let tool = await this.toolStateRepo.findOneBy({ toolType })
    const now = new Date().toISOString()
    if (!tool) {
      tool = this.toolStateRepo.create({
        toolType,
        powerOn: true,
        huntActive: false,
        cameraColor: 'green',
        temperature: 20,
        updatedAt: now
      })
    }
    Object.assign(tool, partial, { toolType, updatedAt: now })
    return this.toolStateRepo.save(tool)
  }

  async reset(): Promise<void> {
    await this.toolStateRepo.clear()
    this.frameBuffer.clear()
    this.spiritPlayerToMjBuffer.clear()
    this.spiritMjToPlayerBuffer.clear()
  }

  setCameraFrame(toolType: string, frameBase64: string): void {
    this.frameBuffer.set(toolType, frameBase64)
  }

  getCameraFrame(toolType: string): string | undefined {
    return this.frameBuffer.get(toolType)
  }

  setSpiritPlayerMessage(toolType: string, audioData: string, mimeType?: string): SpiritAudioMessage {
    const message: SpiritAudioMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      audioData,
      mimeType,
      from: 'player',
      createdAt: new Date().toISOString()
    }
    this.spiritPlayerToMjBuffer.set(toolType, message)
    return message
  }

  getSpiritPlayerMessage(toolType: string): SpiritAudioMessage | undefined {
    return this.spiritPlayerToMjBuffer.get(toolType)
  }

  setSpiritMjMessage(toolType: string, audioData: string, mimeType?: string): SpiritAudioMessage {
    const message: SpiritAudioMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      audioData,
      mimeType,
      from: 'mj',
      createdAt: new Date().toISOString()
    }
    this.spiritMjToPlayerBuffer.set(toolType, message)
    return message
  }

  getSpiritMjMessage(toolType: string): SpiritAudioMessage | undefined {
    return this.spiritMjToPlayerBuffer.get(toolType)
  }

  async updateVanData(
    partial: Partial<
      Pick<
        ToolStateEntity,
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
        | 'vanMessageTemplates'
        | 'vanSentMessages'
        | 'vanStep'
        | 'vanPendingPhoto'
        | 'vanFinalPhoto'
        | 'vanFearMessageAt'
      >
    >
  ): Promise<ToolStateEntity> {
    return this.setToolState(ToolType.VAN, partial)
  }

  // ========== Game State Management ==========

  async initGame(gameId: string, config: GameConfig): Promise<GameStateEntity> {
    const existing = await this.gameStateRepo.findOneBy({ gameId })
    const now = new Date().toISOString()

    const gameState = existing || this.gameStateRepo.create({ gameId })
    gameState.isInitialized = true
    gameState.isRunning = false
    gameState.initialSpectralActivity = config.initialSpectralActivity
    gameState.accelerationRate = config.accelerationRate
    gameState.currentSpectralActivity = config.initialSpectralActivity
    gameState.currentScenarioStep = 0
    gameState.scenarioObjectives = '{}'
    gameState.updatedAt = now

    return this.gameStateRepo.save(gameState)
  }

  async startGame(gameId: string): Promise<GameStateEntity> {
    const gameState = await this.gameStateRepo.findOneBy({ gameId })

    if (!gameState || !gameState.isInitialized) {
      throw new BadRequestException('Game must be initialized first')
    }

    if (gameState.isRunning) {
      throw new BadRequestException('Game is already running')
    }

    gameState.isRunning = true
    gameState.startedAt = new Date().toISOString()
    gameState.updatedAt = gameState.startedAt

    const savedState = await this.gameStateRepo.save(gameState)

    // Démarrer l'accélération de l'activité spectrale
    this.startAcceleration(gameId, gameState.accelerationRate)

    return savedState
  }

  async stopGame(gameId: string): Promise<GameStateEntity> {
    const gameState = await this.gameStateRepo.findOneBy({ gameId })

    if (!gameState) {
      throw new NotFoundException(`Game ${gameId} not found`)
    }

    // Arrêter l'accélération
    if (this.accelerationIntervals.has(gameId)) {
      clearInterval(this.accelerationIntervals.get(gameId))
      this.accelerationIntervals.delete(gameId)
    }

    gameState.isRunning = false
    gameState.updatedAt = new Date().toISOString()

    return this.gameStateRepo.save(gameState)
  }

  async getGameState(gameId: string): Promise<GameStateEntity | null> {
    return this.gameStateRepo.findOneBy({ gameId })
  }

  async advanceScenarioStep(gameId: string): Promise<GameStateEntity> {
    const gameState = await this.gameStateRepo.findOneBy({ gameId })

    if (!gameState) {
      throw new NotFoundException(`Game ${gameId} not found`)
    }

    gameState.currentScenarioStep += 1
    gameState.updatedAt = new Date().toISOString()

    return this.gameStateRepo.save(gameState)
  }

  async updateScenarioObjectives(
    gameId: string,
    objectives: Record<string, boolean>
  ): Promise<GameStateEntity> {
    const gameState = await this.gameStateRepo.findOneBy({ gameId })

    if (!gameState) {
      throw new NotFoundException(`Game ${gameId} not found`)
    }

    gameState.scenarioObjectives = JSON.stringify(objectives || {})
    gameState.updatedAt = new Date().toISOString()

    return this.gameStateRepo.save(gameState)
  }

  private startAcceleration(gameId: string, accelerationRate: number): void {
    // Si un interval existe déjà, le supprimer
    if (this.accelerationIntervals.has(gameId)) {
      clearInterval(this.accelerationIntervals.get(gameId))
    }

    const interval = setInterval(async () => {
      try {
        const gameState = await this.gameStateRepo.findOneBy({ gameId })

        if (!gameState || !gameState.isRunning) {
          clearInterval(interval)
          this.accelerationIntervals.delete(gameId)
          return
        }

        // Augmenter l'activité spectrale (max 100)
        gameState.currentSpectralActivity = Math.min(gameState.currentSpectralActivity + 5, 100)
        gameState.updatedAt = new Date().toISOString()

        await this.gameStateRepo.save(gameState)
      } catch (error) {
        console.error(`Error accelerating game ${gameId}:`, error)
      }
    }, accelerationRate * 1000)

    this.accelerationIntervals.set(gameId, interval)
  }
}
