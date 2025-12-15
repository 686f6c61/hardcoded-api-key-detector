/**
 * Analyzer Worker Thread
 * Worker thread for parallel file analysis
 *
 * @module scanner/analyzerWorker
 * @author 686f6c61
 * @license MIT
 */

const { parentPort } = require('worker_threads');
const ContentAnalyzer = require('./analyzer');

// Initialize analyzer once for this worker
const analyzer = new ContentAnalyzer();

/**
 * Handles messages from parent thread
 */
parentPort.on('message', async task => {
  try {
    const { filePath, options } = task;

    // Analyze the file
    const findings = await analyzer.analyzeContent(filePath, options);

    // Send results back to parent
    parentPort.postMessage({
      filePath,
      findings,
      error: null
    });
  } catch (error) {
    // Send error back to parent
    parentPort.postMessage({
      filePath: task.filePath,
      findings: [],
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});
