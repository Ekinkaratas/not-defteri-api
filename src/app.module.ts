import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { NoteModule } from './note/note.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

// app.module.ts

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
    NoteModule,
    PrismaModule,
  ],
  // BU DİZİLERİ TEMİZLEYİN (App hariç)
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
