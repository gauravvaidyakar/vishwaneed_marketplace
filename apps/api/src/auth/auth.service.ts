import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import { Prisma, Role, UserStatus, type User } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import type {
  ForgotPasswordDto,
  ChangeVendorPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
} from "./auth.dto";

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async register(input: RegisterDto): Promise<Record<string, unknown>> {
    if (input.role === Role.ADMIN)
      throw new BadRequestException(
        "Administrator accounts cannot be self-registered",
      );
    if (!input.email && !input.mobile)
      throw new BadRequestException("Email or mobile is required");
    const pickupPincode = input.businessAddress?.pincode?.trim();
    if (input.role === Role.VENDOR && !/^\d{6}$/.test(pickupPincode ?? ""))
      throw new BadRequestException(
        "A valid 6-digit vendor pickup pincode is required",
      );
    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [
          input.email ? { email: input.email.toLowerCase() } : {},
          input.mobile ? { mobile: input.mobile } : {},
        ],
      },
    });
    if (exists)
      throw new ConflictException(
        "An account already exists for this email or mobile",
      );
    const passwordHash = await hash(input.password, 12);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email?.toLowerCase(),
          mobile: input.mobile,
          passwordHash,
          role: input.role,
        },
      });
      if (input.role === Role.CUSTOMER) {
        const names = input.name?.trim().split(/\s+/);
        await tx.customerProfile.create({
          data: {
            userId: created.id,
            firstName: input.firstName ?? names?.[0] ?? "",
            lastName: input.lastName ?? names?.slice(1).join(" ") ?? "",
            cart: { create: {} },
          },
        });
      } else {
        await tx.vendor.create({
          data: {
            userId: created.id,
            businessName: input.businessName!,
            ownerName: input.ownerName!,
            businessAddress: input.businessAddress as Prisma.InputJsonValue,
            pickupPincode,
            statusHistory: {
              create: {
                toStatus: "REGISTERED",
                actorId: created.id,
                reason: "Vendor registered",
              },
            },
          },
        });
      }
      return created;
    });
    return this.createSession(user);
  }

  async login(input: LoginDto): Promise<Record<string, unknown>> {
    const identifier = input.emailOrMobile.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { mobile: identifier }],
      },
    });
    if (!user || !(await compare(input.password, user.passwordHash)))
      throw new UnauthorizedException("Invalid credentials");
    if (user.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException("Account is not active");
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return this.createSession(user);
  }

  async refresh(input: RefreshDto): Promise<Record<string, unknown>> {
    let payload: { sub: string; type: string };
    try {
      payload = await this.jwt.verifyAsync(input.refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (payload.type !== "refresh")
      throw new UnauthorizedException("Invalid refresh token");
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (
      !user?.refreshTokenHash ||
      !(await compare(input.refreshToken, user.refreshTokenHash))
    )
      throw new UnauthorizedException("Refresh token has been revoked");
    return this.createSession(user);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async forgotPassword(
    input: ForgotPasswordDto,
  ): Promise<Record<string, unknown>> {
    const identifier = input.emailOrMobile.trim();
    const genericResponse: Record<string, unknown> = {
      message: "If the account exists, reset instructions will be sent securely.",
    };
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { mobile: identifier }],
      },
    });
    if (!user || user.status !== UserStatus.ACTIVE) return genericResponse;

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const ttlMinutes = Math.max(
      5,
      Number(this.config.get<string>("PASSWORD_RESET_TTL_MINUTES", "30")),
    );
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      }),
    ]);

    const resetBaseUrl =
      user.role === Role.VENDOR
        ? this.config.get<string>("VENDOR_WEB_URL", "http://localhost:5174")
        : this.config.get<string>("CUSTOMER_WEB_URL", "http://localhost:5173");
    const resetUrl = `${resetBaseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
    await this.notifications?.sendWhatsApp(user.id, "password_reset", {
      resetUrl,
      expiresInMinutes: ttlMinutes,
    });

    if (this.config.get<string>("NODE_ENV", "development") !== "production") {
      genericResponse.developmentResetUrl = resetUrl;
    }
    return genericResponse;
  }

  async resetPassword(input: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = createHash("sha256").update(input.token).digest("hex");
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException("Reset link is invalid or has expired");
    }
    const passwordHash = await hash(input.password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, refreshTokenHash: null },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: "Password updated successfully" };
  }

  async changeVendorPassword(
    userId: string,
    input: ChangeVendorPasswordDto,
  ): Promise<{ message: string; requiresReauthentication: true }> {
    if (input.newPassword !== input.confirmNewPassword) {
      throw new BadRequestException("New password confirmation does not match");
    }
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException(
        "New password must be different from the current password",
      );
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.VENDOR) {
      throw new ForbiddenException("Vendor account access is required");
    }
    if (!(await compare(input.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const passwordHash = await hash(input.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, refreshTokenHash: null },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
    return {
      message: "Password changed successfully. Please sign in again.",
      requiresReauthentication: true,
    };
  }

  private async createSession(user: User): Promise<Record<string, unknown>> {
    const tokens = await this.issueTokens(user);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: await hash(tokens.refreshToken, 12) },
    });
    if (user.role === Role.CUSTOMER) {
      const profile = await this.prisma.customerProfile.findUniqueOrThrow({
        where: { userId: user.id },
      });
      return {
        customer: {
          id: profile.id,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          email: user.email,
          mobile: user.mobile,
          role: Role.CUSTOMER,
        },
        ...tokens,
      };
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      ...tokens,
    };
  }

  private async issueTokens(user: User): Promise<Tokens> {
    const accessOptions: JwtSignOptions = {
      secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.config.get<string>(
        "JWT_ACCESS_TTL",
        "15m",
      ) as JwtSignOptions["expiresIn"],
    };
    const refreshOptions: JwtSignOptions = {
      secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get<string>(
        "JWT_REFRESH_TTL",
        "30d",
      ) as JwtSignOptions["expiresIn"],
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: user.id, role: user.role, type: "access" },
        accessOptions,
      ),
      this.jwt.signAsync({ sub: user.id, type: "refresh" }, refreshOptions),
    ]);
    return { accessToken, refreshToken };
  }
}
