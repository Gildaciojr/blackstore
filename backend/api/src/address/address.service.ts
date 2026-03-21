import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateAddressDto) {
    return this.prisma.address.create({
      data,
    });
  }

  findAll(customerId: string) {
    return this.prisma.address.findMany({
      where: { customerId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  update(id: string, data: UpdateAddressDto) {
    return this.prisma.address.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.address.delete({
      where: { id },
    });
  }
}
