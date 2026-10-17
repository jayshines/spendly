import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import {
  CreateExpenseDto,
  ListExpensesQueryDto,
  UpdateExpenseDto,
} from './expenses.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  @ApiOperation({
    summary: 'List expenses',
    description:
      'Newest first. Filter by category, date range or text; paginated.',
  })
  list(@CurrentUser() user: AuthUser, @Query() query: ListExpensesQueryDto) {
    return this.expenses.list(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Add an expense' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.expenses.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one expense' })
  @ApiNotFoundResponse()
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expenses.get(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiNotFoundResponse()
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenses.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiNotFoundResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expenses.remove(user.id, id);
  }
}
