import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_CATEGORIES } from '../src/categories/default-categories';

const prisma = new PrismaClient();

export const DEMO = { email: 'demo@spendly.dev', password: 'demo12345', name: 'Demo User' };

// Small deterministic PRNG so every seed run produces the same data
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// merchant, min, max (dollars), optional note
const CATALOG: Record<string, { merchants: string[]; min: number; max: number; weight: number }> = {
  'Food & drink': {
    merchants: ['Blue Bottle Coffee', 'Chipotle', 'Sweetgreen', 'Shake Shack', 'Joe’s Pizza', 'Ramen Ya'],
    min: 5, max: 38, weight: 6,
  },
  Groceries: {
    merchants: ['Trader Joe’s', 'Whole Foods', 'Costco', 'Aldi'],
    min: 24, max: 140, weight: 3,
  },
  Transport: {
    merchants: ['Uber', 'Lyft', 'Metro card', 'Shell'],
    min: 4, max: 52, weight: 4,
  },
  Shopping: {
    merchants: ['Amazon', 'Uniqlo', 'IKEA', 'Apple Store'],
    min: 15, max: 220, weight: 2,
  },
  Bills: {
    merchants: ['Verizon', 'ConEd Electric', 'Spotify', 'Netflix', 'iCloud'],
    min: 9, max: 120, weight: 3,
  },
  Health: {
    merchants: ['CVS Pharmacy', 'Equinox', 'Dr. Patel'],
    min: 12, max: 95, weight: 1,
  },
  Entertainment: {
    merchants: ['AMC Theatres', 'Steam', 'Ticketmaster', 'Bowlero'],
    min: 10, max: 85, weight: 2,
  },
  Other: {
    merchants: ['Post Office', 'Dry cleaner', 'Gift'],
    min: 5, max: 60, weight: 1,
  },
};

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO.email } }); // cascades

  const user = await prisma.user.create({
    data: {
      email: DEMO.email,
      name: DEMO.name,
      passwordHash: await bcrypt.hash(DEMO.password, 10),
      categories: { create: DEFAULT_CATEGORIES.map((c) => ({ ...c })) },
    },
    include: { categories: true },
  });
  const byName = new Map(user.categories.map((c) => [c.name, c.id]));

  // Weighted pool of category names
  const pool = Object.entries(CATALOG).flatMap(([name, c]) => Array(c.weight).fill(name));
  const rand = rng(42);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  const rows: {
    userId: string;
    categoryId: string;
    merchant: string;
    amount: number;
    date: Date;
    note: string | null;
  }[] = [];

  // 3 months: the current one (up to today) and the 2 before it
  for (let back = 0; back < 3; back++) {
    const y = today.getUTCFullYear();
    const m = today.getUTCMonth() - back;
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const maxDay = back === 0 ? today.getUTCDate() : lastDay;
    const count = back === 0 ? Math.max(8, Math.round(maxDay * 0.9)) : 22;

    for (let i = 0; i < count; i++) {
      const name = pick(pool);
      const spec = CATALOG[name];
      const day = 1 + Math.floor(rand() * maxDay);
      const date = new Date(Date.UTC(y, m, day));
      if (date.getTime() > todayUtc) continue;
      const amount = Math.round((spec.min + rand() * (spec.max - spec.min)) * 100) / 100;
      rows.push({
        userId: user.id,
        categoryId: byName.get(name)!,
        merchant: pick(spec.merchants),
        amount,
        date,
        note: rand() < 0.15 ? 'Split with friends' : null,
      });
    }
  }

  await prisma.expense.createMany({ data: rows });
  console.log(`Seeded ${DEMO.email} / ${DEMO.password} with ${rows.length} expenses`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
