import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { SummaryService } from './summary.service';

@ApiTags('summary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('summary')
export class SummaryController {
  constructor(private readonly summary: SummaryService) {}

  @Get()
  @ApiOperation({
    summary: 'Monthly summary',
    description:
      'Total, change vs the previous month, per-category breakdown and a daily series.',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    example: '2026-10',
    description: 'YYYY-MM. Defaults to the current month.',
  })
  forMonth(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.summary.forMonth(user.id, month);
  }
}
