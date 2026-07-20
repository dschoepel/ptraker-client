import { useCallback, useEffect, useRef, useState } from 'react';

// Hand-rolled pull-to-refresh — no npm package. Only arms at scrollY === 0,
// requires pulling past `threshold` and holding there for `holdDuration`
// before release triggers onRefresh (stops accidental fast-flick triggers).
// Guards against AntD Modals: they add `ant-scrolling-effect` to <body>
// while open and lock body scroll, so a drag starting inside one would
// otherwise still register here since these listeners are on `document`.
const usePullToRefresh = (onRefresh, { threshold = 100, holdDuration = 400, disabled = false } = {}) => {
  const startY = useRef(0);
  const isPulling = useRef(false);
  const isReady = useRef(false);
  const isHeld = useRef(false);
  const heldAt = useRef(0);

  const [pct, setPct] = useState(0);
  const [held, setHeld] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    onRefresh();
  }, [onRefresh]);

  useEffect(() => {
    if (disabled) return;

    const onStart = (e) => {
      if (window.scrollY > 0) return;
      if (document.body.classList.contains('ant-scrolling-effect')) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = false;
      isReady.current = false;
      isHeld.current = false;
      heldAt.current = 0;
    };

    const onMove = (e) => {
      if (refreshing) return;
      if (window.scrollY > 0) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 10) return;
      e.preventDefault();
      isPulling.current = true;
      const next = Math.min(delta / threshold, 1);
      setPct(next);
      if (next >= 1) {
        if (!isReady.current) {
          isReady.current = true;
          heldAt.current = Date.now();
        } else if (!isHeld.current && Date.now() - heldAt.current >= holdDuration) {
          isHeld.current = true;
          setHeld(true);
        }
      } else if (isReady.current) {
        isReady.current = false;
        isHeld.current = false;
        heldAt.current = 0;
        setHeld(false);
      }
    };

    const onEnd = () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      if (isReady.current && isHeld.current) {
        handleRefresh();
      } else {
        setPct(0);
        setHeld(false);
      }
      isReady.current = false;
      isHeld.current = false;
      heldAt.current = 0;
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);

    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [disabled, threshold, holdDuration, refreshing, handleRefresh]);

  return { pct, held, refreshing };
};

export default usePullToRefresh;
