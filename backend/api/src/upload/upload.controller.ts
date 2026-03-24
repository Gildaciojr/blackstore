import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { UploadService } from './upload.service';
import { imageFileFilter, productImageFilename } from './upload.utils';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('product')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'products'),
        filename: productImageFilename,
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadProductImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    console.log('📦 [UPLOAD]');
    console.log('FILENAME:', file.filename);
    console.log('PATH:', file.path);

    const result = this.uploadService.getProductImageUrl(file.filename);

    console.log('🌐 URL GERADA:', result);

    return result;
  }
}
