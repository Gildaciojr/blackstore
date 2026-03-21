import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';

@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/media',
        filename: (_, file, callback) => {
          const uniqueName = Date.now() + extname(file.originalname);
          callback(null, uniqueName);
        },
      }),
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: CreateMediaDto & { productId?: string }, // 🔥 AQUI
  ) {
    const url = `/uploads/media/${file.filename}`;

    return this.mediaService.create(
      data.type,
      data.title,
      url,
      data.productId, // 🔥 AQUI
    );
  }

  @Get()
  findAll() {
    return this.mediaService.findAll();
  }

  @Get(':type')
  findByType(@Param('type') type: string) {
    return this.mediaService.findAll(type);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.mediaService.delete(id);
  }
}
