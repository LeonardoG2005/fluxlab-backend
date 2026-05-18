import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { SupabaseAuthGuard } from './auth/guards/supabase-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ROLES } from './auth/roles';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('public')
  getPublic() {
    return { message: 'Public route' };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @UseGuards(SupabaseAuthGuard, new RolesGuard([ROLES.ADMIN]))
  @Get('admin')
  getAdmin(@Req() req) {
    return {
      message: 'Admin only',
      user: req.user,
    };
  }
}
