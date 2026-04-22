import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BotsService } from './bots.service';

class CreateBotDto {
  @IsString()
  name: string;

  @IsString()
  botToken: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  apiId: string;

  @IsString()
  apiHash: string;
}

class LogsDto {
  @IsOptional()
  tail?: number;
}

@Controller('bots')
@UseGuards(JwtAuthGuard)
export class BotsController {
  constructor(private botsService: BotsService) {}

  @Get()
  list(@Request() req) {
    return this.botsService.findByUser(req.user.id);
  }

  @Get(':id')
  get(@Param('id') id: string, @Request() req) {
    return this.botsService.findOne(id, req.user.id);
  }

  @Get(':id/logs')
  logs(@Param('id') id: string, @Request() req) {
    return this.botsService.getLogs(id, req.user.id);
  }

  @Get(':id/config')
  getConfig(@Param('id') id: string) {
    return this.botsService.getConfig(id);
  }

  @Post(':id/config')
  saveConfig(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.botsService.saveConfig(id, body);
  }

  @Post()
  create(@Body() body: CreateBotDto, @Request() req) {
    return this.botsService.create(
      req.user.id,
      body.name,
      body.botToken,
      body.phoneNumber,
      body.apiId,
      body.apiHash,
    );
  }

  @Post(':id/start')
  start(@Param('id') id: string, @Request() req) {
    return this.botsService.start(id, req.user.id);
  }

  @Post(':id/stop')
  stop(@Param('id') id: string, @Request() req) {
    return this.botsService.stop(id, req.user.id);
  }

  @Post(':id/restart')
  restart(@Param('id') id: string, @Request() req) {
    return this.botsService.restart(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.botsService.remove(id, req.user.id);
  }
}
