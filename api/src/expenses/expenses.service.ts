import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExpenseDto,
  ListExpensesQueryDto,
  UpdateExpenseDto,
} from './expenses.dto';

const include = {
  category: { select: { id: true, name: true, color: true, icon: true } },
} satisfies Prisma.ExpenseInclude;

type Row = Prisma.ExpenseGetPayload<{ include: typeof include }>;

/** Dates are stored as DATE (no time zone), so UTC midnight round-trips safely. */
const toDate = (s: string) => new Date(`${s}T00:00:00.000Z`);

export const expenseView = (e: Row) => ({
  id: e.id,
  merchant: e.merchant,
  amount: e.amount.toNumber(),
  date: e.date.toISOString().slice(0, 10),
  note: e.note,
  category: e.category,
});

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, q: ListExpensesQueryDto) {
    if (q.from && q.to && q.from > q.to) {
      throw new BadRequestException('"from" must not be after "to"');
    }

    const where: Prisma.ExpenseWhereInput = {
      userId,
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.from || q.to
        ? {
            date: {
              ...(q.from ? { gte: toDate(q.from) } : {}),
              ...(q.to ? { lte: toDate(q.to) } : {}),
            },
          }
        : {}),
      ...(q.q
        ? {
            OR: [
              { merchant: { contains: q.q, mode: 'insensitive' } },
              { note: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { items: rows.map(expenseView), total, page: q.page, limit: q.limit };
  }

  async get(userId: string, id: string) {
    const row = await this.prisma.expense.findFirst({
      where: { id, userId },
      include,
    });
    if (!row) throw new NotFoundException('Expense not found');
    return expenseView(row);
  }

  async create(userId: string, dto: CreateExpenseDto) {
    await this.assertCategory(userId, dto.categoryId);
    const row = await this.prisma.expense.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        merchant: dto.merchant.trim(),
        amount: dto.amount,
        date: toDate(dto.date),
        note: dto.note?.trim() || null,
      },
      include,
    });
    return expenseView(row);
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    await this.get(userId, id); // 404 if missing or not yours
    if (dto.categoryId) await this.assertCategory(userId, dto.categoryId);

    const row = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.merchant !== undefined ? { merchant: dto.merchant.trim() } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.date ? { date: toDate(dto.date) } : {}),
        ...(dto.note !== undefined ? { note: dto.note.trim() || null } : {}),
      },
      include,
    });
    return expenseView(row);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.expense.delete({ where: { id } });
  }

  private async assertCategory(userId: string, categoryId: string) {
    const found = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });
    if (!found) throw new BadRequestException('Unknown category');
  }
}
