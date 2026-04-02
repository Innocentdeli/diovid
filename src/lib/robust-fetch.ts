import https from 'https';
import { URL } from 'url';

/**
 * A robust fetch wrapper using the legacy Node.js 'https' module.
 * This bypasses the 'fetch failed' (TypeError) errors common in Node 22+ 
 * on certain Windows network configurations with Undici.
 */
export async function robustFetch(url: string, options: any = {}): Promise<any> {
    const parsedUrl = new URL(url);
    const body = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;

    const requestOptions: https.RequestOptions = {
        method: options.method || 'GET',
        headers: {
            ...options.headers,
            ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
        timeout: options.timeout || 60000,
    };

    return new Promise((resolve, reject) => {
        const req = https.request(url, requestOptions, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                // Mock the Response object minimal interface
                resolve({
                    ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    json: async () => JSON.parse(responseData),
                    text: async () => responseData,
                });
            });
        });

        req.on('error', (err) => {
            console.error('[ROBUST-FETCH] Socket Error:', err);
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('ROBUST-FETCH: Request timed out'));
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
}
