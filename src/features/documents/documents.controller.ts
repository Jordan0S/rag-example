import { Body, Controller, HttpStatus, Logger, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
    private readonly logger = new Logger(DocumentsController.name);
    constructor(private readonly documentsService: DocumentsService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload a document for processing' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Document uploaded and processed successfully' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file type or size' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Document file to upload',
        type: UploadDocumentDto,
    })
    async uploadDocument(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }),
                ],
            }),
        )
        file: Express.Multer.File,
        @Body() uploadDocumentDto: UploadDocumentDto,
    ) {
        this.logger.log("Controller received file")
        const result = await this.documentsService.uploadDocument(file, {
            ...uploadDocumentDto,
            uploadedAt: new Date().toISOString(),
        });

        return {
            status: 'success',
            data: {
                message: 'File uploaded successfully',
                description: uploadDocumentDto.description,
                file: {
                    originalname: file.originalname,
                    documentId: result.documentId,
                    filename: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    chunksProcessed: result.chunks,
                },
            },
        };
    }
}
