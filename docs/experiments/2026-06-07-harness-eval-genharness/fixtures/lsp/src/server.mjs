export function encodeMessage(message) {
  return JSON.stringify(message);
}

export class MessageBuffer {
  constructor() {
    this.buffer = '';
  }

  push(chunk) {
    this.buffer += chunk;
    return [];
  }
}

export function parseMiniLang(text) {
  return { text, diagnostics: [], symbols: [] };
}

export class MiniLangServer {
  constructor() {
    this.documents = new Map();
    this.notifications = [];
  }

  async handle(message) {
    if (message.method === 'initialize') {
      return { jsonrpc: '2.0', id: message.id, result: { capabilities: {} } };
    }
    if (message.method === 'shutdown') {
      return { jsonrpc: '2.0', id: message.id, result: null };
    }
    return null;
  }

  takeNotifications() {
    const out = this.notifications;
    this.notifications = [];
    return out;
  }

  getDiagnostics(uri) {
    return [];
  }
}
