import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResellersService } from './reseller.service';

@Controller('api/reseller')
@UseGuards(JwtAuthGuard)
export class ResellersController {
  constructor(private resellersService: ResellersService) {}

  @Get()
  get(@Request() req) {
    return this.resellersService.getOrCreate(req.user.id);
  }

  @Get('clients')
  clients(@Request() req) {
    return this.resellersService.getOrCreate(req.user.id).then(r =>
      this.resellersService.getClients(r.id)
    );
  }

  @Put()
  update(@Body() body: any, @Request() req) {
    return this.resellersService.update(req.user.id, body);
  }
}
