// Optional OneSignal init (no-op if not configured)
export function initPush() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!w.OneSignal) return;
    w.OneSignal = w.OneSignal || [];
    w.OneSignal.push(function () {
      w.OneSignal.init({ appId: process.env.REACT_APP_ONESIGNAL_APP_ID });
    });
  } catch (_) {
    // ignore
  }
}


