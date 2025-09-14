/**
 * Worker Service - Main service orchestrator
 *
 * This is the new main entry point that coordinates all worker components.
 * It replaces the monolithic worker.ts with a clean, modular architecture.
 *
 * Responsibilities:
 * - Initialize pg-boss connection
 * - Set up job queues and workers
 * - Start HTTP server
 * - Handle graceful shutdown
 * - Coordinate all subsystems
 */

import 'dotenv/config';
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
 * Main worker service class
 */
export class WorkerService {
  private boss: PgBoss | null = null;
  private app: express.Express;
  private server: any = null;

  constructor() {
    this.app = express();
    this.setupExpress();
    this.setupErrorHandlers();
  }

  /**
   * Start the worker service
   */
  async start(): Promise<void> {
    log('worker_service_starting', {});

    // Start HTTP server first for health checks
    await this.startHttpServer();

    // Initialize pg-boss with retry logic
    await this.initializeBossWithRetry();

    // Start metrics collection
    this.startMetricsCollection();

    log('worker_service_ready', { port: this.getPort() });
  }

  /**
   * Stop the worker service gracefully
   */
  async stop(): Promise<void> {
    log('worker_service_stopping', {});

    try {
      if (this.boss) {
        await this.boss.stop({ graceful: true });
      }
      if (this.server) {
        this.server.close();
      }
    } catch (error) {
      log('worker_service_stop_error', { error: String(error) }, 'warn');
    }

    log('worker_service_stopped', {});
  }

  /**
   * Get the HTTP port
   */
  private getPort(): number {
    return Number(process.env.PORT || DEFAULT_PORT);
  }

  /**
   * Set up Express middleware
   */
  private setupExpress(): void {
    this.app.use(express.json());

    // Basic health check (available immediately)
    this.app.get('/healthz', (_req, res) => {
      res.status(200).send('ok');
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
    const attempt = async (): Promise<void> => {
      try {
        await this.initializeBoss();
      } catch (err) {
        log('boss_init_error', { err: String(err) }, 'error');
        setTimeout(() => {
          attempt();
        }, RETRY_DELAY_MS);
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

    log('boss_initializing', { schema: BOSS_SCHEMA });

    // Create pg-boss instance
    this.boss = new PgBoss({
      connectionString: DATABASE_URL,
      schema: BOSS_SCHEMA,
      ssl: USE_SSL
        ? ({ rejectUnauthorized: false } as TlsConnectionOptions)
        : false,
      application_name: 'zeke-worker',
      max: 2, // Keep connection pool small
      migrate: BOSS_MIGRATE,
    });

    this.boss.on('error', (err) =>
      log('boss_error', { err: String(err) }, 'error')
    );

    // Start pg-boss
    await this.boss.start();
    log('boss_started', { schema: BOSS_SCHEMA });

    // Create job orchestrator
    const orchestrator = createJobOrchestrator(this.boss);

    // Set up all job infrastructure
    await createJobQueues(this.boss);
    await scheduleRecurringJobs(this.boss);
    await setupJobWorkers(this.boss, orchestrator);
    await triggerStartupJobs(this.boss);

    // Set up HTTP routes (now that orchestrator is ready)
    setupRoutes(this.app, orchestrator);

    // Store global reference for compatibility
    bossRef = this.boss;

    log('boss_ready', { queues: 'all queues and workers active' });
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
 * Create and start the worker service
 */
export async function startWorkerService(): Promise<WorkerService> {
  const service = new WorkerService();
  await service.start();
  return service;
}

// Export global boss reference for backward compatibility
export { bossRef };
