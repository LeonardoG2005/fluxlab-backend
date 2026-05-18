import {
  CanActivate,
  ExecutionContext,
  Logger,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { JWTVerifyGetKey } from 'jose';
import { Env } from 'src/env.model';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SupabaseUser } from '../types/supabase-user.interface';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);
  private jwks: JWTVerifyGetKey | null = null;
  private issuer: string | null;
  private joseModulePromise: Promise<typeof import('jose')> | null = null;

  constructor(
    private readonly configService: ConfigService<Env>,
    private readonly reflector: Reflector,
  ) {
    this.issuer = this.resolveIssuer();
  }

  private resolveIssuer(): string | null {
    const projectId = this.configService.get('SUPABASE_PROJECT_ID', {
      infer: true,
    });

    if (projectId) {
      return `https://${projectId}.supabase.co/auth/v1`;
    }

    const supabaseUrl = this.configService.get('SUPABASE_URL', {
      infer: true,
    });

    if (!supabaseUrl) {
      this.logger.warn(
        'SUPABASE_PROJECT_ID and SUPABASE_URL are missing; protected routes will be unavailable.',
      );
      return null;
    }

    try {
      const parsedUrl = new URL(supabaseUrl);
      const [projectFromHost] = parsedUrl.hostname.split('.');

      if (!projectFromHost) {
        return null;
      }

      return `https://${projectFromHost}.supabase.co/auth/v1`;
    } catch {
      this.logger.warn(
        'SUPABASE_URL is invalid; protected routes will be unavailable.',
      );
      return null;
    }
  }

  private async getJoseModule(): Promise<typeof import('jose')> {
    if (!this.joseModulePromise) {
      this.joseModulePromise = import('jose');
    }

    return this.joseModulePromise;
  }

  private async getJwks(): Promise<JWTVerifyGetKey> {
    if (!this.issuer) {
      throw new UnauthorizedException(
        'Supabase auth is not configured on this environment',
      );
    }

    if (!this.jwks) {
      const { createRemoteJWKSet } = await this.getJoseModule();
      this.jwks = createRemoteJWKSet(
        new URL(`${this.issuer}/.well-known/jwks.json`),
      );
    }

    return this.jwks;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    if (!this.issuer) {
      throw new UnauthorizedException(
        'Supabase auth is not configured on this environment',
      );
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const { jwtVerify } = await this.getJoseModule();
      const jwks = await this.getJwks();

      const { payload } = await jwtVerify(token, jwks, {
        issuer: this.issuer,
        audience: 'authenticated',
      });

      request.user = payload as SupabaseUser;
      return true;
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
