import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List your categories (with expense counts)' })
  list(@CurrentUser() user: AuthUser) {
    return this.categories.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiConflictResponse({ description: 'Name already used' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto) {
    return this.categories.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiNotFoundResponse()
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categories.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a category that has no expenses' })
  @ApiConflictResponse({ description: 'Category still has expenses' })
  @ApiNotFoundResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.categories.remove(user.id, id);
  }
}
