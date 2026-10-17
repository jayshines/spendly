import { PartialType } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  /** Unique per user */
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name: string;

  /** Hex colour, e.g. #f97316 */
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color must be a hex colour like #f97316' })
  color: string;

  /** lucide icon name, e.g. utensils */
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  icon: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
