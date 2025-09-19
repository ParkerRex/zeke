/**
 * Engine Service - Main service orchestrator
 *
 * This is the new main entry point that coordinates all engine components.
 * It replaces the monolithic engine.ts with a clean, modular architecture.
 *
 * Responsibilities:
 * - Initialize pg-boss connection
 * - Set up job queues and workers
 * - Start HTTP server
 * - Handle graceful shutdown
 * - Coordinate all subsystems
 */

import { config } from 'dotenv';

// Load environment variables from .env.development if it exists
config({ path: '.env.development' });
config({ path: '.env.local' });
config({ path: '.env' });
import type { ConnectionOptions as TlsConnectionOptions } from 'node:tls';
import express from 'express';
import PgBoss from 'pg-boss';
import { setupRoutes } from '../http/routes.js';
import { log } from '../log.js';
import {
  createJobQueues,
  scheduleRecurringJobs,
  setupJobWorkers,
  triggerStartupJobs,
} from './job-definitions.js';
import { createJobOrchestrator } from './job-orchestrator.js';

// Configuration from environment
const DATABASE_URL: string = process.env.DATABASE_URL ?? '';
const BOSS_SCHEMA = process.env.BOSS_SCHEMA || 'pgboss';
const BOSS_MIGRATE = process.env.BOSS_MIGRATE !== 'false';
const DEFAULT_PORT = 8080;
const RETRY_DELAY_MS = 10_000;
const METRICS_INTERVAL_MS = 3000;

// SSL configuration for database connection
const USE_SSL = !(
  DATABASE_URL.includes('127.0.0.1') ||
  DATABASE_URL.includes('localhost') ||
  DATABASE_URL.includes('host.docker.internal')
);

// Global state
let bossRef: PgBoss | null = null;

/**
 * Main engine service class
 */
export class EngineService {
  private boss: PgBoss | null = null;
  private app: express.Express;
  private server: any = null;
  private isReady: boolean = false;

  constructor() {
    this.app = express();
    this.setupExpress();
    this.setupErrorHandlers();
  }

  /**
   * Start the engine service
   */
  async start(): Promise<void> {
    log('engine_service_starting', {
      nodeEnv: process.env.NODE_ENV,
      port: this.getPort(),
      databaseUrl: DATABASE_URL ? 'configured' : 'missing',
      bossSchema: BOSS_SCHEMA,
      bossMigrate: BOSS_MIGRATE,
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      railway: process.env.RAILWAY_ENVIRONMENT || 'not_detected'
    });

    try {
      // Validate environment variables
      await this.validateEnvironment();
      log('engine_service_env_validated', { message: 'Environment validation passed' });

      // Start HTTP server first for health checks
      await this.startHttpServer();
      log('engine_service_http_started', { port: this.getPort(), message: 'HTTP server ready for health checks' });

      // Initialize pg-boss with retry logic
      await this.initializeBossWithRetry();
      log('engine_service_boss_initialized', { message: 'pg-boss initialization completed' });

      // Start metrics collection
      this.startMetricsCollection();
      log('engine_service_metrics_started', { message: 'Metrics collection started' });

      // Mark service as ready
      this.isReady = true;

      log('engine_service_ready', {
        port: this.getPort(),
        message: 'All systems operational',
        healthEndpoint: `/healthz`,
        readyEndpoint: `/ready`,
        statusEndpoint: `/debug/status`
      });
    } catch (error) {
      log('engine_service_startup_failed', {
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
        port: this.getPort(),
        databaseConfigured: !!DATABASE_URL,
        message: 'Engine service startup failed'
      }, 'error');
      throw error;
    }
  }

  /**
   * Stop the engine service gracefully
   */
  async stop(): Promise<void> {
    log('engine_service_stopping', {});

    try {
      if (this.boss) {
        await this.boss.stop({ graceful: true });
      }
      if (this.server) {
        this.server.close();
      }
    } catch (error) {
      log('engine_service_stop_error', { error: String(error) }, 'warn');
    }

    log('engine_service_stopped', {});
  }

  /**
   * Get the HTTP port
   */
  private getPort(): number {
    return Number(process.env.PORT || DEFAULT_PORT);
  }

  /**
   * Validate required environment variables
   */
  private async validateEnvironment(): Promise<void> {
    log('env_validation_starting', {});

    const requiredVars = ['DATABASE_URL'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      log('env_validation_failed', {
        missingVars,
        message: 'Required environment variables are missing'
      }, 'error');
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    const optionalVars = ['OPENAI_API_KEY', 'YOUTUBE_API_KEY'];
    const presentOptional = optionalVars.filter(varName => process.env[varName]);
    const missingOptional = optionalVars.filter(varName => !process.env[varName]);

    log('env_validation_complete', {
      requiredVars: requiredVars.length,
      optionalPresent: presentOptional,
      optionalMissing: missingOptional,
      message: 'Environment validation passed'
    });
  }

  /**
   * Test database connection before initializing pg-boss
   */
  private async testDatabaseConnection(): Promise<void> {
    log('db_connection_testing', {
      message: 'Testing database connectivity'
    });

    try {
      // Import pg client for connection test
      const { Client } = await import('pg');

      const client = new Client({
        connectionString: DATABASE_URL,
        ssl: USE_SSL ? { rejectUnauthorized: false } : false,
      });

      await client.connect();
      log('db_connection_established', { message: 'Database connection successful' });

      // Test basic query
      const result = await client.query('SELECT version() as version, current_database() as database');
      log('db_connection_verified', {
        version: result.rows[0]?.version?.split(' ')[0] || 'unknown',
        database: result.rows[0]?.database || 'unknown',
        message: 'Database query test successful'
      });

      await client.end();
      log('db_connection_closed', { message: 'Test connection closed' });

    } catch (error) {
      log('db_connection_failed', {
        error: String(error),
        databaseUrl: DATABASE_URL.replace(/:[^:@]*@/, ':***@'), // Hide password
        message: 'Database connection test failed'
      }, 'error');
      throw new Error(`Database connection failed: ${String(error)}`);
    }
  }

  /**
   * Set up Express middleware
   */
  private setupExpress(): void {
    this.app.use(express.json());

    // Basic health check (available immediately for Railway)
    this.app.get('/healthz', (_req, res) => {
      res.status(200).send('ok');
    });

    // Readiness check (only available after full initialization)
    this.app.get('/ready', (_req, res) => {
      if (this.isReady && this.boss) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          boss: 'connected'
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          boss: this.boss ? 'connected' : 'disconnected'
        });
      }
    });
  }

  /**
   * Set up global error handlers
   */
  private setupErrorHandlers(): void {
    process.on('uncaughtException', (err) => {
      log('uncaught_exception', { err: String(err) }, 'error');
    });

    process.on('unhandledRejection', (reason) => {
      log('unhandled_rejection', { reason: String(reason) }, 'error');
    });

    process.on('SIGINT', () => this.handleShutdown('SIGINT'));
    process.on('SIGTERM', () => this.handleShutdown('SIGTERM'));
  }

  /**
   * Start the HTTP server
   */
  private async startHttpServer(): Promise<void> {
    const port = this.getPort();

    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        log('http_server_started', { port });
        resolve();
      });
    });
  }

  /**
   * Initialize pg-boss with retry logic
   */
  private async initializeBossWithRetry(): Promise<void> {
    let attemptCount = 0;
    const maxAttempts = 5;

    const attempt = async (): Promise<void> => {
      attemptCount++;
      try {
        log('boss_init_attempt', {
          attempt: attemptCount,
          maxAttempts,
          databaseUrl: DATABASE_URL.replace(/:[^:@]*@/, ':***@'), // Hide password
          railway: process.env.RAILWAY_ENVIRONMENT || 'not_detected',
          ssl: USE_SSL
        });

        await this.initializeBoss();
      } catch (err) {
        const errorMessage = String(err);
        const isConnectionError = errorMessage.includes('ECONNREFUSED') ||
                                 errorMessage.includes('ENOTFOUND') ||
                                 errorMessage.includes('timeout');

        log('boss_init_error', {
          attempt: attemptCount,
          maxAttempts,
          err: errorMessage,
          errorType: isConnectionError ? 'connection' : 'other',
          willRetry: attemptCount < maxAttempts,
          railway: process.env.RAILWAY_ENVIRONMENT || 'not_detected'
        }, 'error');

        if (attemptCount >= maxAttempts) {
          const finalError = new Error(`Failed to initialize pg-boss after ${maxAttempts} attempts: ${errorMessage}`);
          log('boss_init_final_failure', {
            attempts: maxAttempts,
            lastError: errorMessage,
            databaseUrl: DATABASE_URL.replace(/:[^:@]*@/, ':***@'),
            suggestions: [
              'Check DATABASE_URL is correct',
              'Verify database is accessible',
              'Check worker role permissions',
              'Verify SSL configuration'
            ]
          }, 'error');
          throw finalError;
        }

        log('boss_init_retry', {
          retryIn: RETRY_DELAY_MS / 1000,
          nextAttempt: attemptCount + 1,
          errorType: isConnectionError ? 'connection' : 'other'
        });

        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        await attempt();
      }
    };

    await attempt();
  }

  /**
   * Initialize pg-boss and set up all jobs
   */
  private async initializeBoss(): Promise<void> {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }

    log('boss_initializing', {
      schema: BOSS_SCHEMA,
      ssl: USE_SSL,
      migrate: BOSS_MIGRATE,
      connectionPoolSize: 2
    });

    // Test database connectivity first
    await this.testDatabaseConnection();

    // Create pg-boss instance
    this.boss = new PgBoss({
      connectionString: DATABASE_URL,
      schema: BOSS_SCHEMA,
      ssl: USE_SSL
        ? ({ rejectUnauthorized: false } as TlsConnectionOptions)
        : false,
      application_name: 'zeke-engine',
      max: 2, // Keep connection pool small
      migrate: BOSS_MIGRATE,
    });

    this.boss.on('error', (err) =>
      log('boss_error', { err: String(err) }, 'error')
    );

    // Start pg-boss
    log('boss_starting', { message: 'Starting pg-boss instance' });
    await this.boss.start();
    log('boss_started', { schema: BOSS_SCHEMA });

    // Create job orchestrator
    log('boss_setup_orchestrator', { message: 'Creating job orchestrator' });
    const orchestrator = createJobOrchestrator(this.boss);

    // Set up all job infrastructure
    log('boss_setup_queues', { message: 'Creating job queues' });
    await createJobQueues(this.boss);

    log('boss_setup_recurring', { message: 'Scheduling recurring jobs' });
    await scheduleRecurringJobs(this.boss);

    log('boss_setup_workers', { message: 'Setting up job workers' });
    await setupJobWorkers(this.boss, orchestrator);

    log('boss_setup_startup', { message: 'Triggering startup jobs' });
    await triggerStartupJobs(this.boss);

    // Set up HTTP routes (now that orchestrator is ready)
    log('boss_setup_routes', { message: 'Setting up HTTP routes' });
    setupRoutes(this.app, orchestrator);

    // Store global reference for compatibility
    bossRef = this.boss;

    log('boss_ready', {
      queues: 'all queues and workers active',
      schema: BOSS_SCHEMA,
      message: 'pg-boss fully initialized'
    });
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(async () => {
      try {
        const pg = (await import('../db.js')).default;
        const { upsertJobMetrics } = await import('../db.js');

        const { rows: jobStats } = await pg.query(
          'select name, state, count(*)::int as count from pgboss.job group by 1,2 order by 1,2'
        );

        await upsertJobMetrics(
          jobStats as Array<{ name: string; state: string; count: number }>
        );
      } catch {
        // Ignore metrics errors
      }
    }, METRICS_INTERVAL_MS);
  }

  /**
   * Handle shutdown signals
   */
  private async handleShutdown(signal: string): Promise<void> {
    log('shutdown_signal_received', { signal });
    try {
      await this.stop();
    } finally {
      process.exit(0);
    }
  }
}

/**
 * Create and start the engine service
 */
export async function startEngineService(): Promise<EngineService> {
  const service = new EngineService();
  await service.start();
  return service;
}

// Export global boss reference for backward compatibility
export { bossRef };
