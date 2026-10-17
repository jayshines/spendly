import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MSG = 'must be a date in YYYY-MM-DD format';

export class CreateExpenseDto {
  /** Where the money went, e.g. "Trader Joe's" */
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  merchant: string;

  /** Positive amount with up to 2 decimals */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999)
  amount: number;

  /** YYYY-MM-DD */
  @Matches(DATE, { message: `date ${DATE_MSG}` })
  date: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}

export class ListExpensesQueryDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  /** Inclusive start date, YYYY-MM-DD */
  @IsOptional()
  @Matches(DATE, { message: `from ${DATE_MSG}` })
  from?: string;

  /** Inclusive end date, YYYY-MM-DD */
  @IsOptional()
  @Matches(DATE, { message: `to ${DATE_MSG}` })
  to?: string;

  /** Search merchant and note */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
