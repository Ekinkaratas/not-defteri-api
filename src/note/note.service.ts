import { ForbiddenException, Injectable } from '@nestjs/common';
import { createNoteDto, EditNoteDto, returnDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class NoteService {
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
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        },
      });

      return note;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'A note already exists under this heading!',
          );
        }
      }
      throw error;
    }
  }

  async getNotes(userId: number) {
    const notes = await this.prismaService.note.findMany({
      where: {
        userId: userId,
      },
      select: {
        title: true,
        content: true,

        createdAt: true,
        updatedAt: true,
      },
    });

    return notes;
  }

  async getNotesById(userId: number, noteId: number) {
    const notes = await this.prismaService.note.findMany({
      where: {
        id: noteId,
        userId: userId,
      },
      select: {
        title: true,
        content: true,

        createdAt: true,
        updatedAt: true,
      },
    });

    return notes;
  }

  async editNoteById(userId: number, noteId: number, dto: EditNoteDto) {
    // 1. Güncellenmek istenen notu ID ile veritabanında bul
    const note = await this.prismaService.note.findUnique({
      where: {
        id: noteId,
      },
    });

    // 2. Not var mı VE bu kullanıcıya mı ait diye kontrol et
    if (!note || note.userId !== userId) {
      // Eğer not bulunamazsa veya notun sahibi bu kullanıcı değilse,
      // yetkisiz işlem hatası fırlat.
      throw new ForbiddenException('Access to this note is forbidden');
    }

    // 3. Tüm kontrollerden geçtiyse, notu yeni veri (dto) ile güncelle
    const updatedNote = await this.prismaService.note.update({
      where: {
        id: noteId,
      },
      data: {
        ...dto,
      },
      select: {
        title: true,
        content: true,

        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedNote;
  }

  async deleteById(userId: number, noteId: number) {
    const note = await this.prismaService.note.findUnique({
      where: {
        id: noteId,
      },
    });
    if (!note) {
      throw new ForbiddenException('Note not found or access is forbidden');
    }
    if (note.userId !== userId) {
      throw new ForbiddenException('Access to this note is forbidden');
    }
    await this.prismaService.note.delete({
      where: {
        id: noteId,
      },
    });
  }
}
