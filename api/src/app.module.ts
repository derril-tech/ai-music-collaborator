import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';

import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { LyricsModule } from './modules/lyrics/lyrics.module';
import { GenerateModule } from './modules/generate/generate.module';
import { RenderModule } from './modules/render/render.module';
import { ExportModule } from './modules/export/export.module';
import { HealthModule } from './modules/health/health.module';

import { DatabaseConfig } from './config/database.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Health checks
    TerminusModule,

    // Feature modules
    AuthModule,
    ProjectsModule,
    LyricsModule,
    GenerateModule,
    RenderModule,
    ExportModule,
    HealthModule,
  ],
})
export class AppModule {}
