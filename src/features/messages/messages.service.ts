import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '../ai/ai.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly aiService: AIService) { }

  /**
   * Process a user message and get an AI response
   * @param message The user's message
   * @param conversationId Optional conversation ID for maintaining context
   * @returns The AI's response
   */
  async processMessage(message: string, conversationId?: string): Promise<string> {
    try {
      this.logger.log(`Processing message...`);

      // Get AI response with conversation context
      const response = await this.aiService.getAIResponse(message);

      return response;
    } catch (error) {
      this.logger.error('Error processing message:', error);
      return 'I apologize, but I encountered an error processing your message. Please try again later.';
    }
  }


  // /**
  //  * Clear conversation history
  //  * @param conversationId Optional conversation ID
  //  */
  // async clearConversation(conversationId?: string) {
  //   try {
  //     await this.aiService.clearConversationHistory();
  //     return { success: true };
  //   } catch (error) {
  //     this.logger.error('Error clearing conversation:', error);
  //     return { success: false, error: error.message };
  //   }
  // }
}
