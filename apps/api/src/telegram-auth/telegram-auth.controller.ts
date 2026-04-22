import { Controller, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TelegramAuthService } from './telegram-auth.service';

class VerifyCodeDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  password?: string;
}

@Controller('bots')
@UseGuards(JwtAuthGuard)
export class TelegramAuthController {
  constructor(private telegramAuthService: TelegramAuthService) {}

  @Post(':id/auth/start')
  startAuth(@Param('id') id: string, @Request() req) {
    return this.telegramAuthService.startAuth(id, req.user.id);
  }

  @Post(':id/auth/verify')
  verifyCode(@Param('id') id: string, @Body() body: VerifyCodeDto, @Request() req) {
    return this.telegramAuthService.verifyCode(id, req.user.id, body.code, body.password);
  }
}
