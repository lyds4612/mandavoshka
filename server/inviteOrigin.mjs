import { networkInterfaces } from 'node:os';

const loopbackHost = hostname => hostname === 'localhost' || hostname === '[::1]' || /^127\./.test(hostname);
const privateAddress = address => /^192\.168\./.test(address) || /^10\./.test(address) || /^172\.(1[6-9]|2\d|3[01])\./.test(address);

export const createInviteOriginResolver = (publicOrigin = process.env.PUBLIC_ORIGIN) => {
    if (publicOrigin) {
        const url = new URL(publicOrigin);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('PUBLIC_ORIGIN должен быть HTTP(S)-адресом игры.');
        return () => url.origin;
    }
    return pageOrigin => {
        let url;
        try { url = new URL(pageOrigin); } catch { return null; }
        if (!['http:', 'https:'].includes(url.protocol) || !loopbackHost(url.hostname)) return null;
        const interfaces = networkInterfaces();
        const addresses = Object.entries(interfaces)
            .filter(([name]) => !/loopback|docker|vethernet|virtual|vmware|vbox|tun|tap|vpn/i.test(name))
            .flatMap(([, entries]) => entries ?? [])
            .filter(entry => entry.family === 'IPv4' && !entry.internal && privateAddress(entry.address))
            .sort((left, right) => Number(!left.address.startsWith('192.168.')) - Number(!right.address.startsWith('192.168.')));
        if (!addresses.length) return null;
        url.hostname = addresses[0].address;
        return url.origin;
    };
};
