export function createUpdatePolicy({ applyUpdate = null } = {}) {
  let pending = false;
  let applying = false;
  const subscribers = new Set();
  const notify = () => { for (const subscriber of subscribers) subscriber(); };

  return {
    getSnapshot: () => pending,
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    setApplyUpdate(apply) {
      applyUpdate = apply;
      if (pending && apply) notify();
    },
    requestUpdate() {
      if (pending) return;
      pending = true;
      notify();
    },
    async applyWhenSafe(getAppState) {
      if (!pending || applying || !applyUpdate) return false;
      const state = getAppState();
      if (state?.started !== false || state?.loading !== false || state?.parentGuide !== false) return false;
      applying = true;
      try {
        await applyUpdate();
        pending = false;
        notify();
        return true;
      } catch {
        return false;
      } finally {
        applying = false;
      }
    },
  };
}

export const appUpdates = createUpdatePolicy();

export function observeAppUpdates(registration, serviceWorkers, {
  policy = appUpdates,
  reload = () => window.location.reload(),
} = {}) {
  let activationRequested = false;
  let previousController = null;
  const workers = new Set();
  const checkWaiting = () => {
    if (registration.waiting && (registration.active || serviceWorkers.controller)) policy.requestUpdate();
  };
  const watchInstalling = () => {
    const worker = registration.installing;
    if (worker && !workers.has(worker)) {
      workers.add(worker);
      worker.addEventListener('statechange', checkWaiting);
    }
    checkWaiting();
  };
  const controllerChanged = () => {
    if (!activationRequested || !serviceWorkers.controller || serviceWorkers.controller === previousController) return;
    activationRequested = false;
    reload();
  };
  policy.setApplyUpdate(() => {
    const worker = registration.waiting;
    if (!worker) throw new Error('No waiting app update');
    previousController = serviceWorkers.controller;
    activationRequested = true;
    try {
      worker.postMessage({ type: 'SKIP_WAITING' });
    } catch (error) {
      activationRequested = false;
      throw error;
    }
  });
  serviceWorkers.addEventListener('controllerchange', controllerChanged);
  registration.addEventListener('updatefound', watchInstalling);
  watchInstalling();
  return () => {
    policy.setApplyUpdate(null);
    serviceWorkers.removeEventListener('controllerchange', controllerChanged);
    registration.removeEventListener('updatefound', watchInstalling);
    for (const worker of workers) worker.removeEventListener('statechange', checkWaiting);
  };
}