import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, } from 'class-validator';
import { MessagesService } from './messages.service';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}
@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message and get AI response' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Message processed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createMessageDto: CreateMessageDto) {
    const response = await this.messagesService.processMessage(
      createMessageDto.content,
      createMessageDto.conversationId
    );

    return {
      status: 'success',
      data: {
        content: response,
        conversationId: createMessageDto.conversationId || 'default',
      },
    };
  }

  // @Delete('history')
  // @ApiOperation({ summary: 'Clear conversation history' })
  // @ApiQuery({ name: 'conversationId', required: false })
  // @ApiResponse({ status: HttpStatus.OK, description: 'History cleared successfully' })
  // async clearHistory(@Query('conversationId') conversationId?: string) {
  //   await this.messagesService.clearConversation(conversationId);
  //   return {
  //     status: 'success',
  //     message: 'Conversation history cleared',
  //     conversationId: conversationId || 'default',
  //   };
  // }
}
