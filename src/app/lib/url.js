

export function apiURL() {
    return `${location.protocol}//${location.host}`;
}

export function wsURL() {
    let protocol;
    if (location.protocol === 'https') {
        protocol = 'wss://';
    } else {
        protocol = 'ws://';
    }
    return `${protocol}//${location.host}`;
}
