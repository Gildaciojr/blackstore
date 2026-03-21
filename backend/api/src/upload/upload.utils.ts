import { extname } from 'path';

export function productImageFilename(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
) {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const extension = extname(file.originalname);
  callback(null, `product-${unique}${extension}`);
}

export function imageFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const allowed = /jpg|jpeg|png|webp/;
  const ext = extname(file.originalname).toLowerCase();
  const mimeOk = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);

  if (allowed.test(ext) && mimeOk) {
    callback(null, true);
    return;
  }

  callback(new Error('Formato inválido. Envie JPG, JPEG, PNG ou WEBP.'), false);
}
