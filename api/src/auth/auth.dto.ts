import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  /** Account email (case-insensitive) */
  @IsEmail()
  email: string;

  /** At least 8 characters */
  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt only uses the first 72 bytes
  password: string;

  /** Display name */
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password: string;
}
