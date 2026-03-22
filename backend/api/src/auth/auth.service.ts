import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(data: RegisterDto) {
    /**
     * verificar se email já existe
     */
    const exists = await this.prisma.customer.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new BadRequestException('Email já cadastrado');
    }

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

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(data.password, user.password);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    /**
     * garantir que existe JWT_SECRET
     */
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET não definido no .env');
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
      },
    };
  }
}
