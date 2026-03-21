import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Controller('admin')
export class AdminAuthController {
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    if (body.email !== process.env.ADMIN_EMAIL || body.password !== process.env.ADMIN_PASSWORD) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = jwt.sign({ role: 'admin' }, process.env.ADMIN_JWT_SECRET!, { expiresIn: '7d' });

    return { token };
  }
}
