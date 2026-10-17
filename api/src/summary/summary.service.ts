import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildSummary,
  currentMonth,
  MONTH_RE,
  monthBounds,
} from './summary.util';

@Injectable()
export class SummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async forMonth(userId: string, month = currentMonth()) {
    if (!MONTH_RE.test(month)) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }
    const { start, end, prevStart } = monthBounds(month);

    const [rows, previous, categories] = await Promise.all([
      this.prisma.expense.findMany({
        where: { userId, date: { gte: start, lt: end } },
        select: { amount: true, date: true, categoryId: true },
      }),
      this.prisma.expense.aggregate({
        where: { userId, date: { gte: prevStart, lt: start } },
        _sum: { amount: true },
      }),
      this.prisma.category.findMany({
        where: { userId },
        select: { id: true, name: true, color: true, icon: true },
      }),
    ]);

    return buildSummary({
      month,
      categories,
      previousTotalCents: Math.round(
        (previous._sum.amount?.toNumber() ?? 0) * 100,
      ),
      rows: rows.map((r) => ({
        amountCents: Math.round(r.amount.toNumber() * 100),
        date: r.date.toISOString().slice(0, 10),
        categoryId: r.categoryId,
      })),
    });
  }
}
