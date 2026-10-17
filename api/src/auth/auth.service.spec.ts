import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

function setup() {
  const prisma = {
    user: { create: jest.fn(), findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
  };
  const jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwt as unknown as JwtService,
  );
  return { prisma, jwt, service };
}

describe('AuthService.register', () => {
  it('lowercases the email, hashes the password and seeds default categories', async () => {
    const { prisma, jwt, service } = setup();
    prisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.co', name: 'Ann' });

    const res = await service.register({
      email: '  A@B.co ',
      password: 'supersecret',
      name: ' Ann ',
    });

    const data = prisma.user.create.mock.calls[0][0].data;
    expect(data.email).toBe('a@b.co');
    expect(data.name).toBe('Ann');
    expect(data.passwordHash).not.toBe('supersecret');
    expect(await bcrypt.compare('supersecret', data.passwordHash)).toBe(true);
    expect(data.categories.create.length).toBeGreaterThanOrEqual(5);

    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'a@b.co' });
    expect(res).toEqual({
      accessToken: 'signed.jwt.token',
      user: { id: 'u1', email: 'a@b.co', name: 'Ann' },
    });
  });

  it('rejects a duplicate email with 409', async () => {
    const { prisma, service } = setup();
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '5',
      }),
    );
    await expect(
      service.register({ email: 'a@b.co', password: 'supersecret', name: 'Ann' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not swallow unexpected errors', async () => {
    const { prisma, service } = setup();
    prisma.user.create.mockRejectedValue(new Error('db down'));
    await expect(
      service.register({ email: 'a@b.co', password: 'supersecret', name: 'Ann' }),
    ).rejects.toThrow('db down');
  });
});

describe('AuthService.login', () => {
  it('returns a token for the right password', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.co',
      name: 'Ann',
      passwordHash: await bcrypt.hash('supersecret', 4),
    });
    const res = await service.login({ email: 'A@b.co', password: 'supersecret' });
    expect(res.accessToken).toBe('signed.jwt.token');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@b.co' },
    });
  });

  it('rejects a wrong password and an unknown email with the same message', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'a@b.co',
      name: 'Ann',
      passwordHash: await bcrypt.hash('supersecret', 4),
    });
    const wrong = await service
      .login({ email: 'a@b.co', password: 'nope-nope' })
      .catch((e) => e);

    prisma.user.findUnique.mockResolvedValueOnce(null);
    const unknown = await service
      .login({ email: 'x@y.co', password: 'whatever1' })
      .catch((e) => e);

    expect(wrong).toBeInstanceOf(UnauthorizedException);
    expect(unknown).toBeInstanceOf(UnauthorizedException);
    expect(wrong.message).toBe(unknown.message);
  });
});
