import { Injectable, NotFoundException } from '@nestjs/common';
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

  async update(id: string, data: UpdateAddressDto, authenticatedCustomerId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, customerId: authenticatedCustomerId },
      select: { id: true },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return this.prisma.address.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, authenticatedCustomerId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, customerId: authenticatedCustomerId },
      select: { id: true },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return this.prisma.address.delete({
      where: { id },
    });
  }
}
