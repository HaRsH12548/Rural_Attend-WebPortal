const latencyEnabled = import.meta.env.VITE_MOCK_LATENCY !== 'false';

/**
 * Runs a mock operation after a short simulated network delay.
 * @template T
 * @param {() => T} operation Operation to run after the delay.
 * @returns {Promise<T>} The operation result.
 */
export async function simulate(operation) {
  if (latencyEnabled) {
    const delay = 300 + Math.floor(Math.random() * 201);
    await new Promise((resolve) => window.setTimeout(resolve, delay));
  }

  return operation();
}
