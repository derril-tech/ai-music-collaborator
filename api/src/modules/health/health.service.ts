import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private configService: ConfigService) {}

  getVersion() {
    return {
      version: '1.0.0',
      environment: this.configService.get('NODE_ENV', 'development'),
      timestamp: new Date().toISOString(),
    };
  }

  getConfig() {
    return {
      database: {
        host: this.configService.get('DB_HOST'),
        port: this.configService.get('DB_PORT'),
        database: this.configService.get('DB_DATABASE'),
      },
      redis: {
        host: this.configService.get('REDIS_HOST'),
        port: this.configService.get('REDIS_PORT'),
      },
      nats: {
        url: this.configService.get('NATS_URL'),
      },
      storage: {
        endpoint: this.configService.get('MINIO_ENDPOINT'),
        bucket: this.configService.get('MINIO_BUCKET'),
      },
    };
  }
}
