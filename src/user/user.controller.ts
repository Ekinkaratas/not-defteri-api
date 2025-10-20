import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards';
import { GetUser } from '../auth/decorator/get_user.decorator';
import type { User } from '@prisma/client';

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }
}
