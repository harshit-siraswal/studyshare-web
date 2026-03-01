// Cloudflare Worker - Rate Limiting & Security Headers
// Deploy with: wrangler deploy

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        const configuredOrigin = String(
            env.ORIGIN_API_BASE_URL || env.BACKEND_API_BASE_URL || ''
        ).trim().replace(/\/+$/, '');

        // ===== 1. RATE LIMITING =====
        const rateLimitKey = `rate:${clientIP}`;
        const currentCount = parseInt(await env.RATE_LIMIT_KV?.get(rateLimitKey) || '0');

        if (currentCount > 100) { // 100 requests per minute
            return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '60'
                }
            });
        }

        // Increment counter (expires in 60 seconds)
        if (env.RATE_LIMIT_KV) {
            await env.RATE_LIMIT_KV.put(rateLimitKey, String(currentCount + 1), { expirationTtl: 60 });
        }

        // ===== 2. BOT PROTECTION =====
        const cfData = request.cf;
        // Bot score < 30 = likely a bot (only available on paid plans, gracefully skip on free)
        if (cfData?.botManagement?.score !== undefined && cfData.botManagement.score < 30) {
            return new Response('Access Denied', { status: 403 });
        }

        // ===== 3. FORWARD REQUEST TO ORIGIN =====
        if (!configuredOrigin) {
            return new Response(JSON.stringify({
                error: 'Origin is not configured',
                hint: 'Set ORIGIN_API_BASE_URL (or BACKEND_API_BASE_URL) in Worker environment variables.'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const requestOrigin = `${url.protocol}//${url.host}`.replace(/\/+$/, '');
        if (configuredOrigin.toLowerCase() === requestOrigin.toLowerCase()) {
            return new Response(JSON.stringify({
                error: 'Invalid Worker origin configuration',
                hint: 'ORIGIN_API_BASE_URL must point to upstream origin, not the Worker public URL.'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const originUrl = configuredOrigin + url.pathname + url.search;

        const originRequest = new Request(originUrl, {
            method: request.method,
            headers: request.headers,
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        });

        const response = await fetch(originRequest);
        const newResponse = new Response(response.body, response);

        // ===== 4. ADD SECURITY HEADERS =====
        newResponse.headers.set('X-Content-Type-Options', 'nosniff');
        newResponse.headers.set('X-Frame-Options', 'DENY');
        newResponse.headers.set('X-XSS-Protection', '1; mode=block');
        newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        newResponse.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        return newResponse;
    },
};
