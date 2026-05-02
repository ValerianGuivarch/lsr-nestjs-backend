import { DiaryVM, DiaryVMExample } from './entities/DiaryVM'
import { CreateDiaryRequest } from './requests/CreateDiaryRequest'
import { GetDiaryRequest } from './requests/GetDiaryRequest'
import { UpdateDiaryRequest } from './requests/UpdateDiaryRequest'
import { Diary } from '../../../../../domain/models/diaries/Diary'
import { DiaryService } from '../../../../../domain/services/entities/diaries/DiaryService'
import { generatePageResponseContent } from '../../utils/swagger'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger'
import axios from 'axios'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

@Controller('api/v1/diaries')
@ApiTags('Diaries')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @ApiCreatedResponse({
    description: 'Create a new diary for account',
    type: DiaryVM
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('')
  async createNewDiary(@Body() request: CreateDiaryRequest): Promise<DiaryVM> {
    return DiaryVM.from(
      await this.diaryService.createDiary(
        Diary.toDiaryToCreate({
          text: request.text,
          day: request.day,
          month: request.month,
          year: request.year
        })
      )
    )
  }

  @ApiOkResponse({
    description: 'Get all diaries',
    content: generatePageResponseContent({
      types: DiaryVM,
      examples: {
        Diaries: DiaryVMExample
      }
    })
  })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getManyDiariesByDayAndMonth(@Query() getDiaryRequest: GetDiaryRequest): Promise<DiaryVM[]> {
    const diaries = await this.diaryService.getManyDiariesByDayAndMonth({
      day: getDiaryRequest.day,
      month: getDiaryRequest.month
    })
    return diaries.map(DiaryVM.from)
  }

  @ApiOkResponse({
    description: 'Update a diary',
    type: DiaryVM
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Put(':diaryId')
  async updateDiaryById(@Param('diaryId') diaryId: string, @Body() request: UpdateDiaryRequest): Promise<DiaryVM> {
    return DiaryVM.from(
      await this.diaryService.updateDiary({
        diaryId: diaryId,
        diaryToUpdate: {
          text: request.text
        }
      })
    )
  }

  @ApiOkResponse({
    description: 'Get all missing entries'
  })
  @HttpCode(HttpStatus.OK)
  @Get('/missing')
  async findAllMissingEntries(): Promise<
    {
      day: number
      month: number
      year: number
    }[]
  > {
    const missingEntries = await this.diaryService.findAllMissingEntries()
    return missingEntries.map(DiaryVM.from)
  }

  STORE_STATE_FILE = 'store.txt'

  readStoreState(): Record<string, 'UP' | 'DOWN' | 'STOP'> {
    if (existsSync(this.STORE_STATE_FILE)) {
      return JSON.parse(readFileSync(this.STORE_STATE_FILE, 'utf8'))
    }
    return { StoreSalon: 'STOP', StoreCuisine: 'STOP' }
  }

  updateStoreState(storeName: 'StoreSalon' | 'StoreCuisine', action: 'UP' | 'DOWN' | 'STOP'): void {
    const states = this.readStoreState()
    states[storeName] = action
    writeFileSync(this.STORE_STATE_FILE, JSON.stringify(states), 'utf8')
  }

  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Control store success' })
  @Post('/store/:storeName/:action')
  async controlStore(
    @Param('storeName') storeName: 'StoreSalon' | 'StoreCuisine',
    @Param('action') action: 'UP' | 'DOWN' | 'STOP'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get(`http://192.168.1.142:5000/store`, {
        params: { store: storeName, command: action }
      })

      this.updateStoreState(storeName, action)

      return { success: true, message: response.data }
    } catch (error) {
      return {
        success: false,
        message: `Failed: ${error.response?.data || error.message}`
      }
    }
  }

  @ApiOkResponse({ description: 'Get current store states' })
  @HttpCode(HttpStatus.OK)
  @Get('/stores')
  getStoreStates(): Record<string, 'UP' | 'DOWN' | 'STOP'> {
    return this.readStoreState()
  }
}
