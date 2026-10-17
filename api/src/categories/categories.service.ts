import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

const select = {
  id: true,
  name: true,
  color: true,
  icon: true,
  _count: { select: { expenses: true } },
} as const;

type Row = {
  id: string;
  name: string;
  color: string;
  icon: string;
  _count: { expenses: number };
};

const view = ({ _count, ...c }: Row) => ({ ...c, expenseCount: _count.expenses });

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rows = await this.prisma.category.findMany({
      where: { userId },
      select,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(view);
  }

  async create(userId: string, dto: CreateCategoryDto) {
    try {
      const row = await this.prisma.category.create({
        data: { ...dto, name: dto.name.trim(), userId },
        select,
      });
      return view(row);
    } catch (e) {
      if (isUniqueViolation(e)) throw this.duplicate();
      throw e;
    }
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    await this.assertOwned(userId, id);
    try {
      const row = await this.prisma.category.update({
        where: { id },
        data: { ...dto, ...(dto.name ? { name: dto.name.trim() } : {}) },
        select,
      });
      return view(row);
    } catch (e) {
      if (isUniqueViolation(e)) throw this.duplicate();
      throw e;
    }
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
      select: { _count: { select: { expenses: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category._count.expenses > 0) {
      throw new ConflictException(
        `Category still has ${category._count.expenses} expense(s). Move or delete them first.`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
  }

  private async assertOwned(userId: string, id: string) {
    const found = await this.prisma.category.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Category not found');
  }

  private duplicate() {
    return new ConflictException('You already have a category with this name');
  }
}
