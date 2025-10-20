import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';
import { AuthLoginDto, AuthRegisterDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: AuthRegisterDto) {
    const hash = await argon.hash(dto.password);

    try {
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          hash,
          firstname: dto.firstname,
        },

        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          hash: true,
          role: true,
          Note: true,
          createdAt: true,
        },
      });

      const payload = {
        sub: user.id,
        email: user.email,

        role: user.role,
      };

      return this.takeToken(payload);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken.');
        }
      }
    }
  }

  async login(dto: AuthLoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not Found');
    }

    const hashFlag = await argon.verify(user.hash, dto.password);

    if (!hashFlag) {
      throw new UnauthorizedException('invalid password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.takeToken(payload);
  }

  async takeToken(payload: object): Promise<{ access_token: string }> {
    try {
      const access_token = await this.jwtService.signAsync(payload);

      return {
        access_token,
      };
    } catch (error) {
      console.error('TOKEN OLUŞTURMA HATASI:', error);
      throw new ForbiddenException(error);
    }
  }
}
