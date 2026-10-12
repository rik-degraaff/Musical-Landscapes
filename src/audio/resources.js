export class AudioResources {
  constructor() {
    this.closed = false;
    this.entries = new Map();
    this.cancelled = new Promise(resolve => { this.cancel = resolve; });
  }

  own(resource, dispose = () => resource.dispose()) {
    this.check();
    if (!this.entries.has(resource)) this.entries.set(resource, { dispose, pending: 0, disposed: false });
    return resource;
  }

  check() {
    if (this.closed) throw new Error('Audio initialization cancelled');
  }

  async load(resource, load) {
    this.own(resource);
    const entry = this.entries.get(resource);
    entry.pending++;
    try {
      await load();
      this.check();
      return resource;
    } finally {
      entry.pending--;
      if (this.closed) this.release(entry);
    }
  }

  release(entry) {
    if (entry.disposed || entry.pending) return;
    entry.disposed = true;
    entry.dispose();
  }

  dispose() {
    if (this.closed) return;
    this.closed = true;
    this.cancel();
    for (const entry of [...this.entries.values()].reverse()) this.release(entry);
  }
}