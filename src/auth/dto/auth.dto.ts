import { IsEmail, IsNotEmpty, IsDefined } from 'class-validator';

export class AuthRegisterDto {
  @IsNotEmpty()
  @IsDefined()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsDefined()
  password: string;

  @IsNotEmpty()
  @IsDefined()
  firstname: string;
}

export class AuthLoginDto {
  @IsNotEmpty()
  @IsDefined()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsDefined()
  password: string;
}
