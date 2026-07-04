const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');

function startServer() {
    return new Promise((resolve) => {
        const server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
            resolve(server);
        });
    });
}

async function requestJson(server, path, body = {}) {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });

    return {
        status: response.status,
        body: await response.json().catch(() => null),
    };
}

test('auth login route is reachable without the /api prefix', async () => {
    const server = await startServer();

    try {
        const response = await requestJson(server, '/auth/login', {});
        assert.notEqual(response.status, 404);
        assert.equal(response.body?.message?.includes('Missing required field'), true);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('auth login route is reachable with the /api prefix', async () => {
    const server = await startServer();

    try {
        const response = await requestJson(server, '/api/auth/login', {});
        assert.notEqual(response.status, 404);
        assert.equal(response.body?.message?.includes('Missing required field'), true);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
