import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  constructor(private readonly noteService: NoteService) {}

  @Post('newNote')
  createNote(@GetUser('sub') userId: number, @Body() dto: createNoteDto) {
    return this.noteService.createNote(userId, dto);
  }

  @Get('getNotes')
  getNote(@GetUser('sub') userId: number) {
    return this.noteService.getNotes(userId);
  }

  @Get(':id')
  getNoteById(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) noteId: number,
  ) {
    return this.noteService.getNotesById(userId, noteId);
  }

  @Patch('edit/:id')
  editNoteById(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) noteId: number,
    @Body() dto: EditNoteDto,
  ) {
    return this.noteService.editNoteById(userId, noteId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/delete/:id')
  deleteById(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) noteId: number,
  ) {
    return this.noteService.deleteById(userId, noteId);
  }
}
