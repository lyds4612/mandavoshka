import { createServer } from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { registerRooms } from './rooms.mjs';

const BUILD_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../build');
const MIME_TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2' };

export const createGameServer = (options = {}) => {
    let roomService;
    const server = createServer(async (request, response) => {
        try {
            const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
            if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end(); return; }
            if (pathname === '/health') { response.writeHead(200, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ status: 'ok', rooms: roomService.rooms.size })); return; }
            const candidate = resolve(BUILD_ROOT, `.${pathname}`);
            const rel = relative(BUILD_ROOT, candidate);
            if (rel.startsWith('..') || pathname.includes('\0')) { response.writeHead(403); response.end(); return; }
            let path = pathname === '/' ? resolve(BUILD_ROOT, 'index.html') : candidate;
            try { if (!(await stat(path)).isFile()) path = resolve(BUILD_ROOT, 'index.html'); }
            catch { if (extname(pathname)) { response.writeHead(404); response.end('Not found'); return; } path = resolve(BUILD_ROOT, 'index.html'); }
            const file = await stat(path);
            response.writeHead(200, { 'Content-Type': MIME_TYPES[extname(path)] ?? 'application/octet-stream', 'Content-Length': file.size, 'Cache-Control': path.includes(`${resolve(BUILD_ROOT, 'static')}`) ? 'public, max-age=31536000, immutable' : 'no-cache', 'X-Content-Type-Options': 'nosniff' });
            if (request.method === 'HEAD') response.end();
            else createReadStream(path).on('error', () => response.destroy()).pipe(response);
        } catch {
            response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
            response.end('Фронтенд ещё не собран. Выполните npm run build или запустите npm run dev.');
        }
    });
    const origins = process.env.CLIENT_ORIGIN?.split(',').map(value => value.trim());
    const io = new Server(server, { cors: { origin: origins ?? true }, pingInterval: 3000, pingTimeout: 5000, maxHttpBufferSize: 16_384, ...(origins ? { allowRequest: (request, callback) => callback(null, !request.headers.origin || origins.includes(request.headers.origin)) } : {}) });
    roomService = registerRooms(io, options);
    return { server, io, rooms: roomService.rooms, close: () => new Promise(resolveClose => { roomService.close(); io.close(() => resolveClose()); }) };
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const port = Number(process.env.SOCKET_PORT ?? process.env.PORT ?? 3001);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT должен быть числом от 1 до 65535.');
    const app = createGameServer();
    app.server.on('error', error => { console.error('Не удалось запустить сервер:', error.message); process.exitCode = 1; });
    app.server.listen(port, process.env.HOST ?? '0.0.0.0', () => console.log(`Мандавошка: HTTP и Socket.IO на http://localhost:${port}`));
    const shutdown = () => { app.close().then(() => process.exit(0)); };
    process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
}
