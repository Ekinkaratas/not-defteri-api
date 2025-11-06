import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard, RTGuard } from './guards';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
  ],
  providers: [AuthService, AuthGuard, Logger, RTGuard],
  controllers: [AuthController],
  exports: [AuthGuard],
})
export class AuthModule {}
