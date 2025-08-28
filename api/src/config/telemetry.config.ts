import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

export const telemetryConfig = {
  serviceName: 'ai-music-collaborator-api',
  serviceVersion: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  otlpEndpoint: process.env.OTLP_ENDPOINT || 'http://localhost:4318',
};

export function initializeTelemetry() {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: telemetryConfig.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: telemetryConfig.serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: telemetryConfig.environment,
    }),
    spanProcessor: new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: `${telemetryConfig.otlpEndpoint}/v1/traces`,
      })
    ),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${telemetryConfig.otlpEndpoint}/v1/metrics`,
      }),
      exportIntervalMillis: 1000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingPaths: ['/health', '/metrics'],
        },
        '@opentelemetry/instrumentation-express': {
          ignoreLayers: ['/health', '/metrics'],
        },
      }),
    ],
  });

  sdk.start();

  return sdk;
}

// Custom span names for music generation pipeline
export const SpanNames = {
  // Lyrics processing
  LYRICS_ANALYZE: 'lyrics.analyze',
  LYRICS_VALIDATE: 'lyrics.validate',
  
  // Generation
  MELODY_GENERATE: 'melody.gen',
  HARMONY_GENERATE: 'chords.gen',
  RHYTHM_GENERATE: 'rhythm.gen',
  ARRANGE_RUN: 'arrange.run',
  
  // Audio processing
  SYNTHESIS_RENDER: 'synth.render',
  MIX_MASTER: 'mix.master',
  QA_CHECK: 'qa.check',
  
  // Export
  EXPORT_BUNDLE: 'export.bundle',
  EXPORT_STEMS: 'export.stems',
  EXPORT_MIDI: 'export.midi',
  
  // Database operations
  DB_QUERY: 'db.query',
  DB_TRANSACTION: 'db.transaction',
  
  // External services
  STORAGE_UPLOAD: 'storage.upload',
  STORAGE_DOWNLOAD: 'storage.download',
  CACHE_GET: 'cache.get',
  CACHE_SET: 'cache.set',
} as const;

// Custom metrics
export const Metrics = {
  // Generation metrics
  MELODY_GENERATION_TIME: 'melody.generation.time',
  HARMONY_GENERATION_TIME: 'harmony.generation.time',
  RHYTHM_GENERATION_TIME: 'rhythm.generation.time',
  ARRANGEMENT_TIME: 'arrangement.time',
  
  // Audio metrics
  SYNTHESIS_TIME: 'synthesis.time',
  MIX_MASTER_TIME: 'mix.master.time',
  QA_VALIDATION_TIME: 'qa.validation.time',
  
  // Quality metrics
  LUFS_DEVIATION: 'lufs.deviation',
  TRUE_PEAK_MARGIN: 'true.peak.margin',
  KEY_STABILITY: 'key.stability',
  TIMING_DRIFT: 'timing.drift',
  
  // Export metrics
  EXPORT_TIME: 'export.time',
  EXPORT_SIZE: 'export.size',
  
  // System metrics
  REQUEST_DURATION: 'request.duration',
  ERROR_RATE: 'error.rate',
  ACTIVE_CONNECTIONS: 'active.connections',
} as const;

// Custom attributes for spans
export const SpanAttributes = {
  // Project attributes
  PROJECT_ID: 'project.id',
  PROJECT_NAME: 'project.name',
  PROJECT_GENRE: 'project.genre',
  PROJECT_KEY: 'project.key',
  PROJECT_TEMPO: 'project.tempo',
  
  // Generation attributes
  MELODY_LENGTH: 'melody.length',
  HARMONY_PROGRESSION: 'harmony.progression',
  RHYTHM_PATTERN: 'rhythm.pattern',
  ARRANGEMENT_SECTIONS: 'arrangement.sections',
  
  // Audio attributes
  SAMPLE_RATE: 'audio.sample_rate',
  BIT_DEPTH: 'audio.bit_depth',
  STEM_COUNT: 'audio.stem_count',
  LUFS_TARGET: 'audio.lufs_target',
  LUFS_ACTUAL: 'audio.lufs_actual',
  TRUE_PEAK: 'audio.true_peak',
  
  // Export attributes
  EXPORT_FORMAT: 'export.format',
  EXPORT_TYPES: 'export.types',
  EXPORT_SIZE_BYTES: 'export.size_bytes',
  
  // Error attributes
  ERROR_TYPE: 'error.type',
  ERROR_MESSAGE: 'error.message',
  ERROR_STACK: 'error.stack',
} as const;
