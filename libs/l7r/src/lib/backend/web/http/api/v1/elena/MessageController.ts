import { MessageVM, MessageVMExample } from './entities/MessageVM'
import { CreateMessageRequest, CreateMessageRequestExample } from './requests/CreateMessageRequest'
import { Message } from '../../../../../domain/models/elena/Message'
import { MessageService } from '../../../../../domain/services/entities/elena/MessageService'
import { generateRequestSchemasAndExamples, generateResponseContent } from '../../utils/swagger'
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/messages')
@ApiTags('Elena')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @ApiCreatedResponse({
    description: 'Create a new message',
    content: generateResponseContent<MessageVM>({
      types: MessageVM,
      examples: {
        Example: MessageVMExample
      }
    })
  })
  @ApiBody({
    description: 'Create a new message for account',
    required: true,
    ...generateRequestSchemasAndExamples<CreateMessageRequest>({
      types: CreateMessageRequest,
      examples: {
        Example: CreateMessageRequestExample
      }
    })
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('')
  async createNewMessage(@Body() request: CreateMessageRequest): Promise<MessageVM> {
    return MessageVM.fromMessage(
      await this.messageService.create(
        Message.toMessageToCreate({
          text: request.text,
          senderId: request.senderId
        })
      )
    )
  }

  @ApiOkResponse()
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getMessageById(): Promise<MessageVM[]> {
    return (await this.messageService.findAll()).map(MessageVM.fromMessage)
  }

  @ApiOkResponse()
  @HttpCode(HttpStatus.OK)
  @Get('count')
  async countMessages(): Promise<number> {
    return await this.messageService.count()
  }
}
