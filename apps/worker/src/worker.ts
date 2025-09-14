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
    log('worker_starting', { version: '2.0-modular' });

    const _service = await startWorkerService();

    log('worker_ready', {
      message: 'Worker service is running. Check /healthz for status.',
    });

    // Service will run until process is terminated
  } catch (error) {
    log('worker_startup_failed', { error: String(error) }, 'error');
    process.exit(1);
  }
}

// Start the worker
main();
