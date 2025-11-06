import { IsNotEmpty, IsDefined, IsOptional, IsString } from 'class-validator';

export class createNoteDto {
  @IsNotEmpty()
  @IsString()
  @IsDefined()
  title: string;

  @IsNotEmpty()
  @IsString()
  @IsDefined()
  content: string;
}

export class EditNoteDto {
  @IsString()
  @IsOptional() // Bu alanın gönderilmesi zorunlu değil
  title?: string;

  @IsString()
  @IsOptional() // Bu alanın gönderilmesi zorunlu değil
  content?: string;
}

export class returnDto {
  @IsNotEmpty()
  @IsDefined()
  id: number;
  @IsString()
  title: string;
  @IsString()
  content: string;
}
