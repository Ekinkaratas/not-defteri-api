import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthLoginDto, AuthRegisterDto } from './dto';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards';
import { GetUser } from './decorator/get_user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('Register')
  register(@Body() dto: AuthRegisterDto) {
    return this.authService.register(dto);
  }
  @Post('Login')
  login(@Body() dto: AuthLoginDto) {
    return this.authService.login(dto);
  }
  @UseGuards(AuthGuard) // Logout olmak için önce giriş yapmış olmanız gerekir.
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@GetUser('sub') userId: number) {
    // Bu basit yöntemde sunucunun yapması gereken hiçbir şey yoktur.
    // İstemci token'ı sildiği anda işlem tamamdır.
    // İsteğe bağlı olarak, kimin ne zaman çıkış yaptığını loglayabilirsiniz.
    console.log(`User with ID ${userId} logged out.`);

    return {
      message: 'Logged out successfully',
    };
  }
}
