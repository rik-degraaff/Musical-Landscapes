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

  async load(resource, load, {timeoutMs = 15000} = {}) {
    this.own(resource);
    const entry = this.entries.get(resource);
    entry.pending++;
    // The caller may stop waiting before a browser decode finishes. Keep that
    // work owned until it settles, so a retry cannot dispose its resources.
    const loading = (async () => {
      try {
        await load();
      } finally {
        entry.pending--;
        if (this.closed) this.release(entry);
      }
    })();
    let timer;
    try {
      await Promise.race([
        loading,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('Audio loading timed out; tap to retry')), timeoutMs);
        }),
        this.cancelled.then(() => { throw new Error('Audio initialization cancelled'); }),
      ]);
      this.check();
      return resource;
    } finally {
      clearTimeout(timer);
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
