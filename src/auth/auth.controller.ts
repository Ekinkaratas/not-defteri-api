import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthLoginDto, AuthRegisterDto } from './dto';
import { AuthService } from './auth.service';
import { AuthGuard, RTGuard } from './guards';
import { GetUser } from './decorator/get_user.decorator';
import { GetRefreshToken } from './decorator/RequestWithRtUser';
import { Tokens } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: AuthRegisterDto) {
    this.logger.log(`Processing new user registration.`);
    return this.authService.register(dto);
  }
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: AuthLoginDto) {
    this.logger.log(`Processing login attempt.`);
    return this.authService.login(dto);
  }

  @UseGuards(RTGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refreshTokens(
    @GetUser('sub') userId: number,
    @GetRefreshToken() refreshToken: string,
  ): Promise<Tokens> {
    this.logger.log(`User ${userId} is refreshing tokens.`);
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@GetUser('sub') userId: number) {
    this.logger.log(`The user with ID ${userId} has logged out.`);

    return this.authService.logout(userId);
  }
}
