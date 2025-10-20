import { Module } from '@nestjs/common';
import { NoteService } from './note.service';
import { AuthModule } from '../auth/auth.module';
import { NoteController } from './note.controller';

@Module({
  imports: [AuthModule],
  controllers: [NoteController],
  providers: [NoteService],
})
export class NoteModule {}
