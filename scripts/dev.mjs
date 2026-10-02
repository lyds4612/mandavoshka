import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const children = [
    spawn(process.execPath, ['server/index.mjs'], { stdio: 'inherit' }),
    spawn(process.execPath, [require.resolve('react-scripts/scripts/start.js')], { stdio: 'inherit', env: { ...process.env, BROWSER: process.env.BROWSER ?? 'none' } }),
];
let stopping = false;
const stop = code => {
    if (stopping) return;
    stopping = true;
    children.forEach(child => child.kill('SIGTERM'));
    process.exitCode = code;
};
children.forEach(child => {
    child.on('error', error => { console.error(error.message); stop(1); });
    child.on('exit', code => { if (!stopping) stop(code ?? 1); });
});
process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));
