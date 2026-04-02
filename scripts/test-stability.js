// Simplified stability utility for verification (mirrors src/lib/ai-stability.ts)
async function reliableRequest(
    requestFn,
    options = {}
) {
    const {
        maxRetries = 5,
        baseDelay = 2000,
        maxDelay = 60000,
        onRetry
    } = options;

    let attempt = 0;

    while (true) {
        try {
            return await requestFn();
        } catch (error) {
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
                throw error;
            }

            const currentBaseDelay = isQuotaError ? baseDelay * 2 : baseDelay;
            const exponentialDelay = Math.min(maxDelay, currentBaseDelay * Math.pow(2, attempt - 1));
            const jitter = Math.random() * (exponentialDelay * 0.25);
            const totalDelay = exponentialDelay + jitter;

            if (onRetry) {
                onRetry(attempt, error, totalDelay);
            }

            await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
    }
}


async function testStability() {
    console.log('--- Testing AI Stability Utility ---');

    let attempts = 0;
    const mockFailThenSucceed = async () => {
        attempts++;
        if (attempts < 3) {
            console.log(`[TEST] Simulating 'fetch failed' (Attempt ${attempts})`);
            throw new Error('fetch failed');
        }
        console.log(`[TEST] Success on Attempt ${attempts}`);
        return 'SUCCESS_DATA';
    };

    try {
        const result = await reliableRequest(mockFailThenSucceed, {
            maxRetries: 5,
            baseDelay: 100, // Short delay for testing
            onRetry: (a, e, d) => console.log(`[STABILITY] Retrying in ${Math.round(d)}ms due to: ${e.message}`)
        });
        console.log('Result:', result);
        if (result === 'SUCCESS_DATA') console.log('✅ Basic Retry Test: PASSED');
    } catch (e) {
        console.error('❌ Basic Retry Test: FAILED', e);
    }

    console.log('\n--- Testing Quota Error Backoff ---');
    attempts = 0;
    const mockQuotaError = async () => {
        attempts++;
        if (attempts < 2) {
            console.log(`[TEST] Simulating 'RESOURCE_EXHAUSTED' (Attempt ${attempts})`);
            const err = new Error('RESOURCE_EXHAUSTED');
            err.status = 429;
            throw err;
        }
        return 'QUOTA_FIXED';
    };

    try {
        const result = await reliableRequest(mockQuotaError, {
            maxRetries: 3,
            baseDelay: 200,
            onRetry: (a, e, d) => console.log(`[STABILITY] Quota backoff: ${Math.round(d)}ms`)
        });
        console.log('Result:', result);
        if (result === 'QUOTA_FIXED') console.log('✅ Quota Backoff Test: PASSED');
    } catch (e) {
        console.error('❌ Quota Backoff Test: FAILED', e);
    }
}

testStability();
