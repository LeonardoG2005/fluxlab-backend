import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Env } from './env.model';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { SamplesModule } from './samples/samples.module';
import { AppController } from './app.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService<Env>) => {
        const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();
        const sslRaw = (process.env.DB_SSL ?? '').toLowerCase();
        const sslEnabled = sslRaw
          ? sslRaw === 'true'
          : nodeEnv === 'production';

        const common = {
          type: 'postgres' as const,
          autoLoadEntities: true,
          ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
          retryAttempts: 5,
          retryDelay: 2000,
          // synchronize: true,
        };

        const databaseUrl = process.env.DATABASE_URL?.trim();
        if (databaseUrl) {
          return {
            ...common,
            url: databaseUrl,
          };
        }

        const rawPort = (
          configService.get('SUPABASE_PORT', { infer: true }) ?? ''
        )
          .toString()
          .trim();
        const parsedPort = Number.parseInt(rawPort || '5432', 10);

        return {
          ...common,
          host:
            (
              configService.get('SUPABASE_HOST', { infer: true }) ?? ''
            ).trim() || undefined,
          port: Number.isFinite(parsedPort) ? parsedPort : 5432,
          username:
            (
              configService.get('SUPABASE_USER', { infer: true }) ?? ''
            ).trim() || undefined,
          password:
            configService.get('SUPABASE_PASSWORD', { infer: true }) ||
            undefined,
          database:
            (configService.get('SUPABASE_DB', { infer: true }) ?? '').trim() ||
            undefined,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    ProjectsModule,
    SamplesModule,
<<<<<<< HEAD
    SupabaseModule,
=======
    SupabaseModule,    
    DashboardModule,
>>>>>>> main
  ],
  controllers: [AppController],
})
export class AppModule {}
