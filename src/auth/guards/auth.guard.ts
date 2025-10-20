import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

// Tip güvenliği için payload'un neye benzediğini tanımlıyoruz.
interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

// Express'in Request tipini, 'user' adında bir özellik içerecek şekilde genişletiyoruz.
// Bu, "request['user'] = payload" satırındaki hatayı ortadan kaldırır.
interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. request'e açıkça tip veriyoruz.
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        // 2. 'this' anahtar kelimesini ekliyoruz.
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // 3. Artık bu atama işlemi tamamen tip-güvenli (type-safe).
      request.user = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
