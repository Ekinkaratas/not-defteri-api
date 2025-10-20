import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // Constructor metodunu tamamen kaldırıyoruz.

  async onModuleInit() {
    await this.$connect();
  }
}
