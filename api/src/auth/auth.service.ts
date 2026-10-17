import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { isUniqueViolation } from '../common/prisma-errors';
import { DEFAULT_CATEGORIES } from '../categories/default-categories';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      // The user and the default categories are created together or not at all.
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          name: dto.name.trim(),
          categories: { create: DEFAULT_CATEGORIES.map((c) => ({ ...c })) },
        },
        select: { id: true, email: true, name: true },
      });
      return this.session(user);
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    // Same error for an unknown email and a wrong password (no enumeration).
    const ok = user && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!user || !ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.session({ id: user.id, email: user.email, name: user.name });
  }

  me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  private session(user: { id: string; email: string; name: string }) {
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email });
    return { accessToken, user };
  }
}
