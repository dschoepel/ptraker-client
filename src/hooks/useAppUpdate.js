import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

// Manual service-worker registration (injectRegister: false in vite.config.js)
// so we get onNeedRefresh/onRegisteredSW hooks instead of the plugin's silent
// default script. registerType stays 'autoUpdate' — the new SW still takes
// control on its own, but the already-open tab's JS in memory is stale until
// something reloads it, which is what applyUpdate() is for.
const useAppUpdate = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateSWRef = useRef(null);

  useEffect(() => {
    let intervalId;
    let registrationRef;

    const onVisible = () => {
      if (document.visibilityState === 'visible') registrationRef?.update();
    };

    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_url, registration) {
        if (!registration) return;
        registrationRef = registration;
        intervalId = setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS);
        document.addEventListener('visibilitychange', onVisible);
      },
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const applyUpdate = () => updateSWRef.current?.(true);

  return { needRefresh, applyUpdate };
};

export default useAppUpdate;
