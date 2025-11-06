import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

interface RequestWithRtUser extends Request {
  user: JwtPayload & { refreshToken: string };
}

@Injectable()
export class RTGuard implements CanActivate {
  private readonly logger = new Logger(RTGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: RequestWithRtUser = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      request.user = { ...payload, refreshToken: token };
    } catch {
      this.logger.warn('Invalid or expired refresh token');
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
