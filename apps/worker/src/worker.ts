/**
 * New Worker Entry Point - Clean and Simple
 *
 * This is the new main entry point that replaces the monolithic worker.ts.
 * It's much simpler and easier to understand for beginners.
 *
 * What this file does:
 * 1. Starts the worker service
 * 2. That's it!
 *
 * All the complexity has been moved to focused modules:
 * - core/worker-service.ts: Main service coordination
 * - core/job-definitions.ts: All job configurations
 * - core/job-orchestrator.ts: Consistent job triggering
 * - http/routes.ts: All HTTP endpoints
 */

import { startWorkerService } from './core/worker-service.js';
import { log } from './log.js';

/**
 * Main function - starts the worker service
 */
async function main(): Promise<void> {
  try {
    log('worker_starting', {
      version: '2.0-modular',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      timestamp: new Date().toISOString()
    });

    const service = await startWorkerService();

    log('worker_ready', {
      message: 'Worker service is running. Check /healthz for status.',
      healthEndpoint: `http://localhost:${process.env.PORT || 8080}/healthz`,
      statusEndpoint: `http://localhost:${process.env.PORT || 8080}/debug/status`
    });

    // Service will run until process is terminated
    // Keep the service reference to prevent garbage collection
    process.on('SIGTERM', () => {
      log('worker_shutdown_signal', { signal: 'SIGTERM' });
      service.stop().finally(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      log('worker_shutdown_signal', { signal: 'SIGINT' });
      service.stop().finally(() => process.exit(0));
    });

  } catch (error) {
    log('worker_startup_failed', {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, 'error');
    process.exit(1);
  }
}

// Start the worker
main();
