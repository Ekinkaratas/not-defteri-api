import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards';
import { createNoteDto, EditNoteDto } from './dto';
import { GetUser } from '../auth/decorator/get_user.decorator';
import { NoteService } from './note.service';

@UseGuards(AuthGuard)
@Controller('note')
export class NoteController {
  private readonly logger = new Logger(NoteController.name);

  constructor(private readonly noteService: NoteService) {}

  @Post()
  createNote(@GetUser('sub') userId: number, @Body() dto: createNoteDto) {
    this.logger.log(`User ${userId} is creating a new note.`);
    return this.noteService.createNote(userId, dto);
  }

  @Get()
  getNote(@GetUser('sub') userId: number) {
    this.logger.log(`Fetching all notes for user ${userId}.`);
    return this.noteService.getNotes(userId);
  }

  @Get(':id')
  getNoteById(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) noteId: number,
  ) {
    this.logger.log(`Fetching note ${noteId} for user ${userId}.`);
    return this.noteService.getNotesById(userId, noteId);
  }

  @Patch(':id')
  editNoteById(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) noteId: number,
    @Body() dto: EditNoteDto,
  ) {
    this.logger.log(`User ${userId} is updating note ${noteId}.`);
    return this.noteService.editNoteById(userId, noteId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteById(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) noteId: number,
  ) {
    this.logger.log(`User ${userId} is deleting note ${noteId}.`);
    return this.noteService.deleteById(userId, noteId);
  }
}
