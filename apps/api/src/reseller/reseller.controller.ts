import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ResellerService } from './reseller.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reseller')
@UseGuards(JwtAuthGuard)
export class ResellerController {
  constructor(private readonly resellerService: ResellerService) {}

  // POST /api/reseller — criar painel reseller
  @Post()
  create(@Request() req, @Body() dto: any) {
    return this.resellerService.create(req.user.id, dto);
  }

  // GET /api/reseller — obter painel do dono
  @Get()
  get(@Request() req) {
    return this.resellerService.getByOwner(req.user.id);
  }

  // PATCH /api/reseller — atualizar configurações
  @Patch()
  update(@Request() req, @Body() dto: any) {
    return this.resellerService.update(req.user.id, dto);
  }

  // GET /api/reseller/dashboard — resumo financeiro
  @Get('dashboard')
  dashboard(@Request() req) {
    return this.resellerService.getDashboard(req.user.id);
  }

  // GET /api/reseller/clients — listar clientes
  @Get('clients')
  listClients(@Request() req) {
    return this.resellerService.listClients(req.user.id);
  }

  // POST /api/reseller/clients — adicionar cliente
  @Post('clients')
  addClient(@Request() req, @Body() dto: any) {
    return this.resellerService.addClient(req.user.id, dto);
  }

  // DELETE /api/reseller/clients/:id — inativar cliente
  @Delete('clients/:id')
  removeClient(@Request() req, @Param('id') id: string) {
    return this.resellerService.removeClient(req.user.id, id);
  }

  // GET /api/reseller/commissions — histórico de comissões
  @Get('commissions')
  commissions(@Request() req) {
    return this.resellerService.listCommissions(req.user.id);
  }
}
