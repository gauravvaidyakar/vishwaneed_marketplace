import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/current-user.decorator";
import type { RequestUser } from "../common/request-user";
import { AuthService } from "./auth.service";
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
} from "./auth.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Throttle } from "@nestjs/throttler";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("register")
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  register(@Body() input: RegisterDto) {
    return this.auth.register(input);
  }
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  login(@Body() input: LoginDto) {
    return this.auth.login(input);
  }
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  refresh(@Body() input: RefreshDto) {
    return this.auth.refresh(input);
  }
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  forgotPassword(@Body() input: ForgotPasswordDto) {
    return this.auth.forgotPassword(input);
  }
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  resetPassword(@Body() input: ResetPasswordDto) {
    return this.auth.resetPassword(input);
  }
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: RequestUser): Promise<void> {
    await this.auth.logout(user.id);
  }
}
