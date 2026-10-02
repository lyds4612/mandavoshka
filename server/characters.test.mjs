import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { io } from 'socket.io-client';
import { createGameServer } from './index.mjs';
import { CHARACTERS } from '../src/shared/characters.js';

const fixture = async t => {
    const app = createGameServer({ rollValues: () => [6, 3], rollDuration: () => 60_000 });
    const clients = [];
    t.after(async () => { clients.forEach(client => client.disconnect()); await app.close(); });
    app.server.listen(0, '127.0.0.1');
    await once(app.server, 'listening');
    return {
        app,
        async connect() {
            const client = io(`http://127.0.0.1:${app.server.address().port}`, { transports: ['websocket'], reconnection: false, timeout: 3000 });
            clients.push(client);
            await new Promise((resolve, reject) => { client.once('connect', resolve); client.once('connect_error', reject); });
            return client;
        },
    };
};
const request = (client, event, data = {}) => client.timeout(3000).emitWithAck(event, data);
const success = async (client, event, data) => {
    const reply = await request(client, event, data);
    assert.equal(reply.ok, true, reply.error?.message);
    return reply;
};

test('A valid single character is required before creating or joining; invalid choices consume no seats', { timeout: 10_000 }, async t => {
    const { app, connect } = await fixture(t);
    const host = await connect(), guest = await connect();
    const invalid = [undefined, '', 'unknown', '__proto__', ['archiver'], ['archiver', 'epstein'], { id: 'archiver' }];
    for (const characterId of invalid) {
        const reply = await request(host, 'room:create', { name: 'Host', characterId });
        assert.equal(reply.error.code, 'BAD_CHARACTER');
        assert.equal(app.rooms.size, 0);
    }
    const created = await success(host, 'room:create', { name: 'Host', characterId: 'archiver' });
    for (const characterId of invalid) {
        const reply = await request(guest, 'room:join', { code: created.snapshot.code, name: 'Guest', characterId });
        assert.equal(reply.error.code, 'BAD_CHARACTER');
        assert.equal(app.rooms.get(created.snapshot.code).players.length, 1);
    }
    // One choice belongs to each player; choosing the same character does not reserve it for everyone else.
    const joined = await success(guest, 'room:join', { code: created.snapshot.code, name: 'Guest', characterId: 'archiver' });
    assert.deepEqual(joined.snapshot.players.map(player => player.characterId), ['archiver', 'archiver']);
});

test('All seven authored characters are accepted and published with their player identity', { timeout: 10_000 }, async t => {
    const { connect } = await fixture(t);
    for (const character of CHARACTERS) {
        const client = await connect();
        const created = await success(client, 'room:create', { name: character.id, characterId: character.id });
        const player = created.snapshot.players[0];
        assert.equal(player.characterId, character.id);
        assert.equal(player.id, created.session.playerId);
        assert.equal(player.name, character.id);
        assert.equal(JSON.stringify(created.snapshot).includes(created.session.token), false);
        assert.equal('tokenHash' in player || 'socketId' in player, false);
    }
});

test('Recovery, reconnect and a new party retain the original character and game state', { timeout: 10_000 }, async t => {
    const { app, connect } = await fixture(t);
    const host = await connect(), guest = await connect();
    const created = await success(host, 'room:create', { name: 'Host', characterId: 'cashback' });
    const joined = await success(guest, 'room:join', { code: created.snapshot.code, name: 'Guest', characterId: 'mafioznik' });
    const code = created.snapshot.code;
    const started = await success(host, 'room:start');
    assert.equal(started.snapshot.game.players.length, 2);
    const command = async (type, extra = {}) => success(host, 'game:command', {
        id: `${type}-${Date.now()}`, revision: app.rooms.get(code).revision, type, ...extra,
    });
    const rolled = await command('roll');
    await command('skip', { rollId: rolled.snapshot.game.diceRoll.id });
    const placed = await command('place', { pieceIndex: 0 });
    const game = structuredClone(placed.snapshot.game);
    const disconnected = new Promise(resolve => host.on('room:state', snapshot => { if (snapshot.paused) resolve(); }));
    guest.disconnect(); await disconnected;
    const returning = await connect();
    const recovered = await success(returning, 'room:recover', { sessions: [{ code, token: joined.session.token }] });
    assert.equal(recovered.sessions[0].characterId, 'mafioznik');
    assert.equal(JSON.stringify(recovered).includes(joined.session.token), false);
    // A reconnect cannot rename the player or change the already selected character.
    const resumed = await success(returning, 'room:resume', { code, token: joined.session.token, name: 'Changed', characterId: 'epstein' });
    const me = resumed.snapshot.players.find(player => player.id === joined.session.playerId);
    assert.equal(me.name, 'Guest');
    assert.equal(me.characterId, 'mafioznik');
    assert.equal(resumed.snapshot.paused, false);
    assert.deepEqual(resumed.snapshot.game, game);
    const restarted = await success(host, 'room:restart');
    assert.equal(restarted.snapshot.phase, 'waiting');
    assert.deepEqual(restarted.snapshot.players.map(player => player.characterId), ['cashback', 'mafioznik']);
});
