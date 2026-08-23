/**
 * Error tracking and performance monitoring utilities.
 * Provides Sentry-ready interface with console fallback when Sentry is not installed.
 */

// --- Error Tracking ---

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

/**
 * Capture an exception for error tracking.
 * Uses Sentry if available, otherwise falls back to console.error.
 */
export function captureException(error: unknown, context?: ErrorContext): void {
  const sentryAvailable = typeof window !== 'undefined' && 'Sentry' in window;

  if (sentryAvailable) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      level: context?.level || 'error',
    });
  } else {
    console.error('[StockFlow Error]', error, context || '');
  }
}

/**
 * Capture an informational message for tracking.
 * Uses Sentry if available, otherwise falls back to console.warn/info.
 */
export function captureMessage(message: string, context?: ErrorContext): void {
  const sentryAvailable = typeof window !== 'undefined' && 'Sentry' in window;
  const level = context?.level || 'info';

  if (sentryAvailable) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Sentry.captureMessage(message, {
      tags: context?.tags,
      extra: context?.extra,
      level,
    });
  } else {
    const logFn = level === 'warning' || level === 'error' || level === 'fatal'
      ? console.warn
      : console.info;
    logFn(`[StockFlow ${level.toUpperCase()}]`, message, context || '');
  }
}

// --- Performance Timing ---

interface TimerEntry {
  name: string;
  startTime: number;
}

const activeTimers = new Map<string, TimerEntry>();

/**
 * Start a performance timer with a given name.
 * Returns the timer name for use with endTimer.
 */
export function startTimer(name: string): string {
  activeTimers.set(name, {
    name,
    startTime: performance.now(),
  });
  return name;
}

/**
 * End a performance timer and return the duration in milliseconds.
 * Logs the duration if in development mode.
 */
export function endTimer(name: string): number {
  const timer = activeTimers.get(name);
  if (!timer) {
    console.warn(`[StockFlow Perf] Timer "${name}" not found. Was it started?`);
    return 0;
  }

  const duration = performance.now() - timer.startTime;
  activeTimers.delete(name);

  if (import.meta.env.DEV) {
    console.debug(`[StockFlow Perf] ${name}: ${duration.toFixed(2)}ms`);
  }

  return duration;
}

// --- API Call Duration Tracking ---

interface ApiCallMetrics {
  url: string;
  method: string;
  duration: number;
  status: number | null;
  success: boolean;
  timestamp: number;
}

const apiCallHistory: ApiCallMetrics[] = [];
const MAX_API_HISTORY = 100;

/**
 * Track the duration of an API call.
 * Wraps a fetch-like function to measure and record its performance.
 */
export async function trackApiCall<T>(
  name: string,
  url: string,
  method: string,
  fn: () => Promise<T>,
): Promise<T> {
  const startTime = performance.now();
  let status: number | null = null;
  let success = false;

  try {
    const result = await fn();
    success = true;

    // Try to extract status if result looks like a Response
    if (result && typeof result === 'object' && 'status' in result) {
      status = (result as { status: number }).status;
    }

    return result;
  } catch (error) {
    captureException(error, {
      tags: { api_call: name },
      extra: { url, method },
    });
    throw error;
  } finally {
    const duration = performance.now() - startTime;

    const metrics: ApiCallMetrics = {
      url,
      method,
      duration,
      status,
      success,
      timestamp: Date.now(),
    };

    apiCallHistory.push(metrics);
    if (apiCallHistory.length > MAX_API_HISTORY) {
      apiCallHistory.shift();
    }

    if (import.meta.env.DEV) {
      const statusStr = status ? ` [${status}]` : '';
      const successStr = success ? 'OK' : 'FAILED';
      console.debug(
        `[StockFlow API] ${method} ${url}${statusStr} - ${successStr} (${duration.toFixed(0)}ms)`,
      );
    }
  }
}

/**
 * Get recent API call metrics for debugging and monitoring.
 */
export function getApiCallHistory(): readonly ApiCallMetrics[] {
  return apiCallHistory;
}
