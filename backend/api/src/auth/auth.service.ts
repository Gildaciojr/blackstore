import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(data: RegisterDto) {
    const hash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.customer.create({
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: hash,
      },
    });

    return user;
  }

  async login(data: LoginDto) {
    const user = await this.prisma.customer.findUnique({
      where: { email: data.email },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(data.password, user.password);

    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });

    return { token };
  }
}
