/**
 * AI Stability Utility
 * Provides reliable request wrapping with exponential backoff and jitter
 * for Google Cloud Vertex AI and other transient API calls.
 */

export interface ReliableRequestOptions {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any, delay: number) => void;
}

/**
 * Executes an async function with exponential backoff and jitter.
 * Specifically handles 429 (Rate Limit) and transient network errors.
 */
export async function reliableRequest<T>(
    requestFn: () => Promise<T>,
    options: ReliableRequestOptions = {}
): Promise<T> {
    const {
        maxRetries = 5,
        baseDelay = 2000,
        maxDelay = 60000,
        onRetry = (attempt, error, delay) => {
            console.warn(`[STABILITY] Attempt ${attempt} failed. Retrying in ${Math.round(delay / 1000)}s... Error: ${error.message || 'Unknown error'}`);
        }
    } = options;

    let attempt = 0;

    while (true) {
        try {
            return await requestFn();
        } catch (error: any) {
            attempt++;

            const isQuotaError =
                error.message?.includes('429') ||
                error.message?.includes('RESOURCE_EXHAUSTED') ||
                error.message?.includes('quota');

            const isTransientError =
                isQuotaError ||
                error.message?.includes('fetch failed') ||
                error.message?.includes('network') ||
                error.message?.includes('timeout') ||
                error.message?.includes('deadline') ||
                error.name === 'TypeError' ||
                error.status === 503 ||
                error.status === 504;

            if (!isTransientError || attempt > maxRetries) {
                if (attempt > maxRetries) {
                    console.error(`[STABILITY] Maximum retries (${maxRetries}) reached. Final error:`, error.message);
                }
                throw error;
            }

            // Calculate exponential backoff: baseDelay * 2^(attempt-1)
            // Use longer base delay for quota errors
            const currentBaseDelay = isQuotaError ? baseDelay * 2 : baseDelay;
            const exponentialDelay = Math.min(maxDelay, currentBaseDelay * Math.pow(2, attempt - 1));

            // Add jitter (up to 25% of the delay)
            const jitter = Math.random() * (exponentialDelay * 0.25);
            const totalDelay = exponentialDelay + jitter;

            if (onRetry) {
                onRetry(attempt, error, totalDelay);
            }

            await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
    }
}
