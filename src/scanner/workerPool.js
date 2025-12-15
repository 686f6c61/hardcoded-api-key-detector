/**
 * Worker Pool for Parallel File Analysis
 * Manages worker threads for concurrent file scanning
 *
 * @module scanner/workerPool
 * @author 686f6c61
 * @license MIT
 */

const { Worker } = require('worker_threads');
const os = require('os');
const logger = require('../utils/logger');

/**
 * Worker pool for parallel task execution
 *
 * @class WorkerPool
 * @example
 * const pool = new WorkerPool('./analyzerWorker.js', 4);
 * await pool.initialize();
 * const result = await pool.execute({ filePath: './test.js', options: {} });
 */
class WorkerPool {
  /**
   * Creates a new WorkerPool instance
   *
   * @param {string} workerScript - Path to worker script
   * @param {number} [poolSize=cpuCount] - Number of workers to create
   */
  constructor(workerScript, poolSize = os.cpus().length) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.queue = [];
    this.activeWorkers = 0;
  }

  /**
   * Initializes all workers in the pool
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    logger.debug(`Initializing worker pool with ${this.poolSize} workers`);

    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerScript);

      worker.on('error', error => {
        logger.error(`Worker ${i} error`, { error: error.message });
      });

      worker.on('exit', code => {
        if (code !== 0) {
          logger.warn(`Worker ${i} exited with code ${code}`);
        }
      });

      this.workers.push({
        worker,
        busy: false,
        id: i
      });
    }

    logger.info(`Worker pool initialized with ${this.poolSize} workers`);
  }

  /**
   * Executes a task using an available worker
   *
   * @param {Object} task - Task to execute
   * @returns {Promise<any>} Task result
   */
  async execute(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Processes the task queue
   *
   * @private
   */
  processQueue() {
    if (this.queue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;

    const { task, resolve, reject } = this.queue.shift();
    availableWorker.busy = true;
    this.activeWorkers++;

    logger.debug(`Assigning task to worker ${availableWorker.id}`);

    availableWorker.worker.postMessage(task);

    const messageHandler = result => {
      availableWorker.busy = false;
      this.activeWorkers--;
      availableWorker.worker.removeListener('message', messageHandler);
      availableWorker.worker.removeListener('error', errorHandler);
      resolve(result);
      this.processQueue();
    };

    const errorHandler = error => {
      availableWorker.busy = false;
      this.activeWorkers--;
      availableWorker.worker.removeListener('message', messageHandler);
      availableWorker.worker.removeListener('error', errorHandler);
      reject(error);
      this.processQueue();
    };

    availableWorker.worker.once('message', messageHandler);
    availableWorker.worker.once('error', errorHandler);
  }

  /**
   * Terminates all workers
   *
   * @returns {Promise<void>}
   */
  async terminate() {
    logger.debug(`Terminating worker pool (${this.workers.length} workers)`);

    await Promise.all(
      this.workers.map(({ worker }) => worker.terminate())
    );

    this.workers = [];
    this.queue = [];
    this.activeWorkers = 0;

    logger.info('Worker pool terminated');
  }

  /**
   * Gets pool statistics
   *
   * @returns {Object} Pool statistics
   * @returns {number} return.totalWorkers - Total workers
   * @returns {number} return.activeWorkers - Currently active workers
   * @returns {number} return.queueSize - Pending tasks in queue
   */
  getStats() {
    return {
      totalWorkers: this.workers.length,
      activeWorkers: this.activeWorkers,
      queueSize: this.queue.length
    };
  }
}

module.exports = WorkerPool;
