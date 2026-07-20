import { Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { brandColors } from '../theme';

// Grows with pull distance (`pct`), turns gold once held past the threshold,
// swaps to a spinner while the refresh is in flight. Rendered just below the
// fixed mobile header by AppLayout.
const PullToRefreshIndicator = ({ pct, held, refreshing }) => {
  if (pct <= 0 && !refreshing) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        top: 56 + pct * 48,
        transform: 'translateX(-50%)',
        zIndex: 99,
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: brandColors.darkCard,
        border: `1px solid ${brandColors.darkBorder}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: refreshing ? 'top 0.2s' : 'none',
      }}
    >
      {refreshing ? (
        <Spin size="small" />
      ) : (
        <ReloadOutlined
          style={{
            fontSize: 16,
            color: held ? brandColors.gold : brandColors.textMuted,
            transform: `rotate(${pct * 180}deg)`,
            transition: 'color 0.2s',
          }}
        />
      )}
    </div>
  );
};

export default PullToRefreshIndicator;
