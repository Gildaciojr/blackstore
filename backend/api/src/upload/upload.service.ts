import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  getProductImageUrl(filename: string) {
    return {
      filename,
      url: `/uploads/products/${filename}`,
    };
  }
}
