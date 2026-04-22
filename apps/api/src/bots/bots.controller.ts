import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BotsService } from './bots.service';

@Controller('api/bots')
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

  @Post()
  create(@Body() body: { name: string }, @Request() req) {
    return this.botsService.create(req.user.id, body.name);
  }

  @Post(':id/start')
  start(@Param('id') id: string, @Request() req) {
    return this.botsService.start(id, req.user.id);
  }

  @Post(':id/stop')
  stop(@Param('id') id: string, @Request() req) {
    return this.botsService.stop(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.botsService.remove(id, req.user.id);
  }
}
