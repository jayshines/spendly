import { Prisma } from '@prisma/client';

export function isUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
  );
}

export function isForeignKeyViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003'
  );
}
