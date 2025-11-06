import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createNoteDto, EditNoteDto, returnDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class NoteService {
  private readonly logger = new Logger(NoteService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async createNote(userId: number, dto: createNoteDto): Promise<returnDto> {
    try {
      const note = await this.prismaService.note.create({
        data: {
          title: dto.title,
          content: dto.content,
          userId: userId,
        },

        select: {
          id: true,
          title: true,
          content: true,
        },
      });

      this.logger.log(`User ${userId} successfully created a new note.`);
      return note;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.error(
          `User ${userId} could not create a new note: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          'A server-related error occurred.',
        );
      }

      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : String(error);

      this.logger.error(
        `User ${userId} could not create a new note: ${message}`,
        stack,
      );
      throw new InternalServerErrorException('An unknown error has occurred.');
    }
  }

  async getNotes(userId: number): Promise<returnDto[]> {
    const notes = await this.prismaService.note.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (notes.length === 0) {
      this.logger.warn(`User ID ${userId} has no notes.`);
    } else {
      this.logger.log(
        `User ID ${userId} retrieved ${notes.length} notes successfully.`,
      );
    }

    return notes;
  }

  async getNotesById(userId: number, noteId: number): Promise<returnDto> {
    const note = await this.prismaService.note.findUnique({
      where: {
        id_userId: { id: noteId, userId },
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (note === null) {
      this.logger.warn(`User ID ${userId} has no note by ${noteId}.`);
      throw new NotFoundException('Note not found');
    }

    this.logger.log(`User ID ${userId} retrieved ${noteId} note successfully.`);
    return note;
  }

  async editNoteById(
    userId: number,
    noteId: number,
    dto: EditNoteDto,
  ): Promise<returnDto> {
    try {
      const note = await this.prismaService.note.update({
        where: {
          id: noteId,
          userId: userId,
        },

        data: {
          ...dto,
        },
        select: {
          id: true,
          title: true,
          content: true,
        },
      });

      this.logger.log(
        `Note ID ${noteId} has been successfully updated by user ID ${userId}.`,
      );
      return note;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `The note with ID ${noteId} does not belong to the user with ID ${userId}: ${error.message}.`,
        );
        throw new NotFoundException(
          'An operation failed because it depends on one or more records that were required but not found.',
        );
      }

      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : String(error);

      this.logger.error(
        `Failed to update note ID ${noteId} for user ID ${userId}: ${message}.`,
        stack,
      );
      throw new InternalServerErrorException(error);
    }
  }

  async deleteById(userId: number, noteId: number): Promise<boolean> {
    try {
      await this.prismaService.note.delete({
        where: {
          id_userId: { id: noteId, userId },
        },
      });

      this.logger.log(
        `Note ID ${noteId} successfully deleted by user ID ${userId}.`,
      );

      return true;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `Delete failed: note ID ${noteId} does not belong to user ID ${userId} or does not exist.`,
        );
        throw new NotFoundException('Note not found or access forbidden.');
      }

      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : String(error);

      this.logger.error(
        `Failed to delete note ID ${noteId} for user ID ${userId}: ${message}`,
        stack,
      );

      throw new InternalServerErrorException(
        'Unexpected error occurred while deleting the note.',
      );
    }
  }
}
