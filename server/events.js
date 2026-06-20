// Tiny in-memory pub/sub for Server-Sent Events (SSE).
// Every connected browser holds one open response; when any entry changes we
// push a one-line "entries-changed" event and each client re-reads the DB.

const clients = new Set();

export function addClient(res) {
  clients.add(res);
}

export function removeClient(res) {
  clients.delete(res);
}

// Notify all connected clients that the data changed.
export function broadcast(event = 'entries-changed', data = {}) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}

export function clientCount() {
  return clients.size;
}
