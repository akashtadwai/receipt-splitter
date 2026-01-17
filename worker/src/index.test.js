import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from './index.js';

// Mock environment
const createEnv = (overrides = {}) => ({
    MISTRAL_API_KEY: 'test-api-key',
    ALLOWED_ORIGIN: 'https://akashtadwai.github.io',
    ...overrides
});

// Helper to create mock requests
const createRequest = (method, options = {}) => {
    const { body, origin = 'http://localhost:3000' } = options;
    return new Request('http://localhost:8787/process-receipt', {
        method,
        headers: { Origin: origin },
        body
    });
};

describe('Worker Integration Tests', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    // CORS Tests
    describe('CORS Handling', () => {
        it('handles OPTIONS preflight with correct headers', async () => {
            const request = createRequest('OPTIONS');
            const response = await worker.fetch(request, createEnv());

            expect(response.status).toBe(200);
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
            expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
        });

        it('allows production origin', async () => {
            const request = createRequest('OPTIONS', { origin: 'https://akashtadwai.github.io' });
            const response = await worker.fetch(request, createEnv());

            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://akashtadwai.github.io');
        });
    });

    // Request Validation
    describe('Request Validation', () => {
        it('rejects non-POST requests', async () => {
            const request = createRequest('GET');
            const response = await worker.fetch(request, createEnv());

            expect(response.status).toBe(405);
            expect(await response.json()).toEqual({ error: 'Method not allowed' });
        });

        it('rejects requests without file', async () => {
            const formData = new FormData();
            const request = createRequest('POST', { body: formData });
            const response = await worker.fetch(request, createEnv());

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ detail: 'No file provided' });
        });
    });

    // API Integration
    describe('Mistral API Integration', () => {
        it('calls Mistral API with correct payload', async () => {
            const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                is_receipt: true,
                                ocr_contents: { items: [{ name: 'Coffee', price: 5.0 }], total_order_bill_details: { taxes: [] } }
                            })
                        }
                    }]
                }))
            );

            const formData = new FormData();
            formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'receipt.jpg');

            const request = createRequest('POST', { body: formData });
            const response = await worker.fetch(request, createEnv());

            expect(response.status).toBe(200);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.mistral.ai/v1/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-api-key'
                    })
                })
            );
        });

        it('returns error when image is not a receipt', async () => {
            vi.spyOn(global, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                is_receipt: false,
                                reason: 'This is a menu, not a receipt'
                            })
                        }
                    }]
                }))
            );

            const formData = new FormData();
            formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'menu.jpg');

            const request = createRequest('POST', { body: formData });
            const response = await worker.fetch(request, createEnv());

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ detail: 'This is a menu, not a receipt' });
        });

        it('handles Mistral API failure', async () => {
            vi.spyOn(global, 'fetch').mockResolvedValueOnce(
                new Response('API Error', { status: 500 })
            );

            const formData = new FormData();
            formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'receipt.jpg');

            const request = createRequest('POST', { body: formData });
            const response = await worker.fetch(request, createEnv());

            expect(response.status).toBe(500);
            expect(await response.json()).toEqual({ detail: 'Error processing receipt with AI' });
        });
    });
});
