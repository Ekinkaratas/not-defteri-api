import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';
import { AuthLoginDto, AuthRegisterDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async getTokens(
    id: number,
    email: string,
    role: string,
  ): Promise<Tokens> {
    const payload = {
      sub: id,
      email,
      role,
    };

    try {
      const [access_token, refresh_token] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        }),

        this.jwtService.signAsync(payload, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        }),
      ]);

      this.logger.log('Tokens have been created');

      return {
        access_token: access_token,
        refresh_token: refresh_token,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const stack = e instanceof Error ? e.stack : String(e);

      this.logger.error(`TOKEN CREATION ERROR: : ${message}`, stack);
      throw new InternalServerErrorException(e);
    }
  }

  private async updateRefreshTokenHash(
    userId: number,
    refresh_token: string,
  ): Promise<boolean> {
    const token_hash = await argon.hash(refresh_token);
    try {
      await this.prismaService.user.update({
        where: {
          id: userId,
        },

        data: {
          refresh_token: token_hash,
        },
      });

      this.logger.log('refles token have been update');

      return true;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `Refresh token update failed for user ${userId}: : ${error.message}.`,
        );
        throw new NotFoundException('No user record found');
      }

      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : String(error);

      this.logger.error(
        `Failed to update refresh token for user ${userId}: ${message}`,
        stack,
      );
      throw new InternalServerErrorException(
        'Unexpected error while updating refresh token',
      );
    }
  }

  async register(dto: AuthRegisterDto): Promise<Tokens> {
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
          email: true,
          role: true,
        },
      });

      this.logger.log(`The user with Email ${user.email} registered.`);

      const tokens: Tokens = await this.getTokens(
        user.id,
        user.email,
        user.role,
      );

      await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

      return tokens;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.error(
            `Registration failed: Email ${dto.email} is already in use: ${error.message}`,
            error.stack,
          );

          throw new ForbiddenException('Credentials taken.');
        }
        this.logger.error(
          `Unexpected Prisma error during registration for email ${dto.email}:${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          'An unexpected database error occurred.',
        );
      } else {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : String(error);

        this.logger.error(
          `Unexpected error during registration for email ${dto.email}:${message}`,
          stack,
        );
        throw new InternalServerErrorException(error);
      }
    }
  }

  async login(dto: AuthLoginDto): Promise<Tokens> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },

      select: {
        id: true,
        email: true,
        role: true,
        hash: true,
      },
    });

    const passwordMatches = user
      ? await argon.verify(user.hash, dto.password)
      : false;

    if (!user || !passwordMatches) {
      this.logger.warn(
        `Login failed: Invalid credentials for email ${dto.email}.`,
      );
      throw new ForbiddenException('Credentials incorrect');
    }

    const tokens: Tokens = await this.getTokens(user.id, user.email, user.role);

    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    this.logger.log(`The user with email ${user.email} login`);

    return tokens;
  }

  async logout(userId: number): Promise<boolean> {
    try {
      await this.prismaService.user.update({
        where: {
          id: userId,
        },

        data: {
          refresh_token: null,
        },
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `An error occurred while deleting the user with ID ${userId}: ${message}`,
      );
      throw new InternalServerErrorException(
        'Unexpected error while updating refresh token',
      );
    }
  }

  async refreshTokens(userId: number, refreshToken: string): Promise<Tokens> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        refresh_token: true,
      },
    });

    if (!user || !user.refresh_token) {
      this.logger.warn(
        `Refresh attempt for user ${userId} failed: User not found or logged out.`,
      );
      await this.logout(userId);
      throw new ForbiddenException('Access Denied: No valid session.');
    }

    const tokensMatch = await argon.verify(user.refresh_token, refreshToken);

    if (!tokensMatch) {
      this.logger.warn(
        `Refresh attempt for user ${userId} failed: Token mismatch.`,
      );

      throw new ForbiddenException('Access Denied: Invalid refresh token.');
    }

    this.logger.log(`User ${userId} successfully verified refresh token.`);
    const newTokens = await this.getTokens(user.id, user.email, user.role);

    await this.updateRefreshTokenHash(user.id, newTokens.refresh_token);

    return newTokens;
  }
}
