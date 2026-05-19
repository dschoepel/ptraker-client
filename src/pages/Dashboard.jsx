import { useState, useEffect,useCallback } from 'react';
import {
  Row, Col, Card, Statistic, Table, Tag, Typography,
  Spin, Alert, Grid, Space, Collapse, Tabs, App as AntdApp,
  Button
} from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined,
  RightOutlined, ReloadOutlined, CrownOutlined
} from '@ant-design/icons';
import { dashboardService, priceService } from '../services/dashboard.service';
import { sharesService } from '../services/admin.service';
import {
  formatCurrency, formatPercent, formatShares,
  formatDateTime, gainLossColor, institutionName,
  assetTypeName
} from '../utils/formatters';
import { brandColors } from '../theme';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// =============================================================================
// Sub-components — defined OUTSIDE Dashboard
// =============================================================================

const GainLossIndicator = ({ value }) => {
  if (value === null || value === undefined) return <MinusOutlined style={{ color: brandColors.neutral }} />;
  if (value > 0) return <ArrowUpOutlined style={{ color: brandColors.gain }} />;
  if (value < 0) return <ArrowDownOutlined style={{ color: brandColors.loss }} />;
  return <MinusOutlined style={{ color: brandColors.neutral }} />;
};

const ColoredValue = ({ value, formatter = formatCurrency }) => {
  if (value === null || value === undefined) return <span style={{ color: brandColors.neutral }}>—</span>;
  const color = gainLossColor(value);
  return <span style={{ color }}>{formatter(value)}</span>;
};

const SummaryCards = ({ netWorth, priceInfo, isMobile }) => (
  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
    <Col xs={12} sm={12} md={6}>
      <Card size="small" style={{ borderColor: brandColors.darkBorder }}>
        <Statistic
          title={<Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>Total Value</Text>}
          value={netWorth?.total_current_value || 0}
          precision={2}
          styles={{ content: { color: '#fff', fontSize: isMobile ? 18 : 26, fontWeight: 700 } }}
          formatter={(val) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      </Card>
    </Col>
    <Col xs={12} sm={12} md={6}>
      <Card size="small" style={{ borderColor: brandColors.darkBorder }}>
        <Statistic
          title={<Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>Total Cost</Text>}
          value={netWorth?.total_cost_basis || 0}
          precision={2}
          styles={{ content: { color: brandColors.textSecondary, fontSize: isMobile ? 18 : 26 } }}
          formatter={(val) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      </Card>
    </Col>
    <Col xs={12} sm={12} md={6}>
      <Card size="small" style={{ borderColor: brandColors.darkBorder }}>
        <Statistic
          title={<Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>Total Gain/Loss</Text>}
          value={netWorth?.total_gain_loss || 0}
          precision={2}
          styles={{ content: { color: gainLossColor(netWorth?.total_gain_loss), fontSize: isMobile ? 18 : 26, fontWeight: 600 } }}
          formatter={(val) => {
            const v = Number(val);
            const sign = v >= 0 ? '+' : '-';
            return `${sign}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }}
          suffix={
            <Text style={{ fontSize: 12, color: gainLossColor(netWorth?.total_gain_loss), marginLeft: 4 }}>
              ({formatPercent(netWorth?.total_gain_loss_percent)})
            </Text>
          }
        />
      </Card>
    </Col>
    <Col xs={12} sm={12} md={6}>
      <Card size="small" style={{ borderColor: brandColors.darkBorder }}>
        <Statistic
          title={<Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>Today's Change</Text>}
          value={netWorth?.total_days_change || 0}
          precision={2}
          styles={{ content: { color: gainLossColor(netWorth?.total_days_change), fontSize: isMobile ? 18 : 26, fontWeight: 600 } }}
          formatter={(val) => {
            const v = Number(val);
            const sign = v >= 0 ? '+' : '-';
            return `${sign}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }}
        />
        {priceInfo?.newestPriceAt && (
          <Text style={{ color: brandColors.textMuted, fontSize: 11, display: 'block', marginTop: 4 }}>
            as of {formatDateTime(priceInfo.newestPriceAt)}
          </Text>
        )}
      </Card>
    </Col>
  </Row>
);

const AccountPanelHeader = ({ account }) => {
  const daysSince = account.last_imported_at
    ? Math.floor(
        (new Date().getTime() - new Date(account.last_imported_at).getTime())
        / (1000 * 60 * 60 * 24)
      )
    : null;

  const freshnessColor = daysSince === null ? brandColors.textMuted
    : daysSince === 0 ? brandColors.gain
    : daysSince <= 7  ? brandColors.textSecondary
    : '#faad14';

  return (
    <Row align="middle" gutter={[8, 0]} style={{ width: '100%', padding: '2px 0' }}>
      <Col xs={24} sm={8} md={6}>
        <Text
          style={{
            color: '#fff', fontWeight: 600, fontSize: 13,
            whiteSpace: 'nowrap', overflow: 'hidden',
            textOverflow: 'ellipsis', maxWidth: 200, display: 'block',
          }}
          title={account.account_name}
        >
          {account.account_name}
        </Text>
        <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>
          {institutionName(account.institution)}
        </Text>
      </Col>
      <Col xs={8} sm={4} md={3}>
        <Text style={{ color: brandColors.textMuted, fontSize: 11, display: 'block' }}>Value</Text>
        <Text style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
          {formatCurrency(account.total_current_value)}
        </Text>
      </Col>
      <Col xs={8} sm={4} md={3}>
        <Text style={{ color: brandColors.textMuted, fontSize: 11, display: 'block' }}>Cost</Text>
        <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>
          {formatCurrency(account.total_cost_basis)}
        </Text>
      </Col>
      <Col xs={8} sm={4} md={3}>
        <Text style={{ color: brandColors.textMuted, fontSize: 11, display: 'block' }}>Gain/Loss</Text>
        {account.account_type === 'checking' || account.account_type === 'savings' ? (
          <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>—</Text>
        ) : (
          <Space size={4}>
            <GainLossIndicator value={account.total_gain_loss} />
            <ColoredValue value={account.total_gain_loss} />
          </Space>
        )}
      </Col>
      <Col xs={0} sm={0} md={3}>
        <Text style={{ color: brandColors.textMuted, fontSize: 11, display: 'block' }}>Today</Text>
        {account.account_type === 'checking' || account.account_type === 'savings' ? (
          <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>—</Text>
        ) : (
          <ColoredValue value={account.total_days_change} />
        )}
      </Col>
      <Col xs={0} sm={0} md={2}>
        <Text style={{ color: brandColors.textMuted, fontSize: 11, display: 'block' }}>Holdings</Text>
        <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>{account.position_count}</Text>
      </Col>
      <Col xs={0} sm={0} md={4}>
        <Text style={{ color: brandColors.textMuted, fontSize: 11, display: 'block' }}>Last Import</Text>
        {account.last_imported_at ? (
          <Space size={4}>
            <Text style={{ color: freshnessColor, fontSize: 12 }}>
              {daysSince === 0 ? 'Today'
                : daysSince === 1 ? 'Yesterday'
                : `${daysSince}d ago`}
            </Text>
            <Text style={{ color: freshnessColor, fontSize: 11 }}>
              {new Date(account.last_imported_at).toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit'
              })}
            </Text>
          </Space>
        ) : (
          <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>Never</Text>
        )}
      </Col>
    </Row>
  );
};

const desktopColumns = [
  {
    title: 'Ticker',
    dataIndex: 'ticker',
    key: 'ticker',
    width: 110,
    render: (val, row) => (
      <Space direction="vertical" size={0}>
        <Text style={{ color: '#fff', fontWeight: 600 }}>{val}</Text>
        <Text style={{
          color: brandColors.textMuted, fontSize: 11,
          maxWidth: 100, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
        }} title={row.asset_name}>
          {row.asset_name}
        </Text>
      </Space>
    ),
  },
  {
    title: 'Type',
    dataIndex: 'asset_type',
    key: 'asset_type',
    width: 90,
    render: (val) => <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>{assetTypeName(val)}</Text>,
  },
  {
    title: 'Shares',
    dataIndex: 'shares',
    key: 'shares',
    width: 90,
    align: 'right',
    render: (val) => <Text style={{ color: brandColors.textSecondary }}>{formatShares(val)}</Text>,
  },
  {
    title: 'Price',
    dataIndex: 'current_price',
    key: 'current_price',
    width: 100,
    align: 'right',
    render: (val, row) => (
      <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
        <Text style={{ color: '#fff' }}>{formatCurrency(val)}</Text>
        <Text style={{ fontSize: 11, color: gainLossColor(row.change_percent) }}>
          {formatPercent(row.change_percent)}
        </Text>
      </Space>
    ),
  },
  {
    title: 'Value',
    dataIndex: 'current_value',
    key: 'current_value',
    width: 115,
    align: 'right',
    sorter: (a, b) => (a.current_value || 0) - (b.current_value || 0),
    render: (val) => <Text style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(val)}</Text>,
  },
  {
    title: 'Cost',
    dataIndex: 'cost_basis',
    key: 'cost_basis',
    width: 110,
    align: 'right',
    render: (val) => <Text style={{ color: brandColors.textSecondary }}>{formatCurrency(val)}</Text>,
  },
  {
    title: 'Gain/Loss',
    dataIndex: 'gain_loss',
    key: 'gain_loss',
    width: 135,
    align: 'right',
    sorter: (a, b) => (a.gain_loss || 0) - (b.gain_loss || 0),
    render: (val, row) => {
      if (row.asset_type === 'cash') return <Text style={{ color: brandColors.neutral }}>—</Text>;
      return (
        <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
          <Space size={4}>
            <GainLossIndicator value={val} />
            <ColoredValue value={val} />
          </Space>
          <ColoredValue value={row.gain_loss_percent} formatter={formatPercent} />
        </Space>
      );
    },
  },
  {
    title: 'Today',
    dataIndex: 'days_change',
    key: 'days_change',
    width: 100,
    align: 'right',
    render: (val, row) => {
      if (row.asset_type === 'cash') return <Text style={{ color: brandColors.neutral }}>—</Text>;
      return <ColoredValue value={val} />;
    },
  },
];

const MobilePositionCard = ({ position }) => (
  <Card size="small" style={{ marginBottom: 8, borderColor: brandColors.darkBorder }}>
    <Row justify="space-between" align="middle">
      <Col>
        <Space size={8}>
          <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{position.ticker}</Text>
          <Tag style={{ fontSize: 10 }}>{assetTypeName(position.asset_type)}</Tag>
        </Space>
        <Text style={{ color: brandColors.textSecondary, fontSize: 11, display: 'block' }}>
          {position.asset_name}
        </Text>
      </Col>
      <Col style={{ textAlign: 'right' }}>
        <Text style={{ color: '#fff', fontWeight: 600, fontSize: 14, display: 'block' }}>
          {formatCurrency(position.current_value)}
        </Text>
        {position.asset_type !== 'cash' && (
          <Space size={4}>
            <GainLossIndicator value={position.gain_loss} />
            <ColoredValue value={position.gain_loss_percent} formatter={formatPercent} />
          </Space>
        )}
      </Col>
    </Row>
  </Card>
);

const AccountPositionsTable = ({ positions, accountSummary, isMobile }) => {
  if (isMobile) {
    return (
      <div style={{ padding: '8px 0' }}>
        {positions.map(p => <MobilePositionCard key={p.id} position={p} />)}
      </div>
    );
  }

  return (
    <Table
      dataSource={positions}
      columns={desktopColumns}
      rowKey="id"
      size="small"
      pagination={false}
      scroll={{ x: 850 }}
      style={{ borderRadius: 0 }}
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row style={{ background: brandColors.darkHover }}>
            <Table.Summary.Cell index={0} colSpan={4}>
              <Text style={{ color: brandColors.textSecondary, fontWeight: 600, fontSize: 12 }}>
                Account Total
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right">
              <Text style={{ color: '#fff', fontWeight: 700 }}>
                {formatCurrency(accountSummary.total_current_value)}
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5} align="right">
              <Text style={{ color: brandColors.textSecondary }}>
                {formatCurrency(accountSummary.total_cost_basis)}
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6} align="right">
              {accountSummary.account_type === 'checking' || accountSummary.account_type === 'savings' ? (
                <Text style={{ color: brandColors.textSecondary }}>—</Text>
              ) : (
                <ColoredValue value={accountSummary.total_gain_loss} />
              )}
            </Table.Summary.Cell>
            <Table.Summary.Cell index={7} align="right">
              {accountSummary.account_type === 'checking' || accountSummary.account_type === 'savings' ? (
                <Text style={{ color: brandColors.textSecondary }}>—</Text>
              ) : (
                <ColoredValue value={accountSummary.total_days_change} />
              )}
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  );
};

// =============================================================================
// PortfolioView — reusable portfolio display (own + shared)
// =============================================================================
const PortfolioView = ({ netWorth, accounts, positions, priceInfo, isMobile, refreshing, onRefresh, readOnly = false, isOwn = false }) => {
  
    // Show empty state for own portfolio with no accounts
  if (isOwn && (!accounts || accounts.length === 0)) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{
          background: brandColors.darkCard,
          border: `1px solid ${brandColors.darkBorder}`,
          borderRadius: 12,
          padding: 40,
          maxWidth: 480,
          margin: '0 auto',
        }}>
          <Text style={{ fontSize: 32, display: 'block', marginBottom: 16 }}>📊</Text>
          <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>
            Your portfolio is empty
          </Title>
          <Text style={{ color: brandColors.textSecondary, display: 'block', marginBottom: 24 }}>
            You currently have view-only access. To track your own investments,
            request an upgrade to a full account.
          </Text>
          <Button
            type="primary"
            icon={<CrownOutlined />}
            onClick={() => window.location.href = '/profile'}
            style={{ fontWeight: 600 }}
          >
            Request Full Access
          </Button>
        </div>
      </div>
    );
  }
  
  const positionsByAccount = (positions || []).reduce((acc, pos) => {
    if (!acc[pos.account_id]) acc[pos.account_id] = [];
    acc[pos.account_id].push(pos);
    return acc;
  }, {});

  const collapseItems = (accounts || []).map(account => ({
    key: account.account_id,
    label: <AccountPanelHeader account={account} />,
    children: (
      <AccountPositionsTable
        positions={positionsByAccount[account.account_id] || []}
        accountSummary={account}
        isMobile={isMobile}
      />
    ),
    style: {
      marginBottom: 8,
      borderRadius: 8,
      border: `1px solid ${brandColors.darkBorder}`,
      overflow: 'hidden',
    },
  }));

  return (
    <div>
      <SummaryCards netWorth={netWorth} priceInfo={priceInfo} isMobile={isMobile} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Title level={5} style={{ color: brandColors.textSecondary, margin: 0 }}>
          Accounts
          <Text style={{ color: brandColors.textMuted, fontSize: 13, marginLeft: 8, fontWeight: 400 }}>
            ({(accounts || []).length} accounts · {(positions || []).length} holdings)
          </Text>
        </Title>
        <Space>
          {priceInfo?.newestPriceAt && (
            <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
              Prices as of {formatDateTime(priceInfo.newestPriceAt)}
            </Text>
          )}
          {!readOnly && onRefresh && (
            <Button
              type="text"
              icon={<ReloadOutlined spin={refreshing} />}
              loading={refreshing}
              onClick={onRefresh}
              style={{ color: brandColors.textSecondary }}
            >
              Refresh Prices
            </Button>
          )}
        </Space>
      </div>

      <Collapse
        ghost
        defaultActiveKey={[]}
        expandIcon={({ isActive }) => (
          <RightOutlined
            style={{
              color: brandColors.textMuted,
              fontSize: 12,
              transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        )}
        items={collapseItems}
        style={{ background: 'transparent' }}
      />
    </div>
  );
};

// =============================================================================
// Dashboard Page
// =============================================================================
const Dashboard = () => {
  const [dashboard, setDashboard]           = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [shares, setShares]                 = useState([]);
  const [sharedDashboards, setSharedDashboards] = useState({});
  const [activeTab, setActiveTab]           = useState('mine');
  const [refreshing, setRefreshing]         = useState(false);
  const screens                             = useBreakpoint();
  const isMobile                            = !screens.md;
  const { message }                         = AntdApp.useApp();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [dashData, sharesData] = await Promise.all([
          dashboardService.getDashboard(),
          sharesService.getShares(),
        ]);
        if (!cancelled) {
          setDashboard(dashData);
          setShares(sharesData.viewing || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

const loadSharedDashboard = useCallback(async (ownerId) => {
  if (sharedDashboards[ownerId]) return;
  try {
    const data = await sharesService.getSharedDashboard(ownerId);
    setSharedDashboards(prev => ({ ...prev, [ownerId]: data }));
  } catch {
    message.error('Failed to load shared portfolio');
  }
}, [sharedDashboards, message]);

// Auto-switch to shared tab if viewer has no own accounts
  useEffect(() => {
  const autoSwitch = async () => {
    if (!loading && shares.length > 0 && dashboard && (!dashboard.accounts || dashboard.accounts.length === 0)) {
      setActiveTab(shares[0].owner_user_id);
      await loadSharedDashboard(shares[0].owner_user_id);
    }
  };
  autoSwitch();
}, [loading, shares, dashboard, loadSharedDashboard]);  

  



  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      await priceService.refresh();
      const data = await dashboardService.getDashboard();
      setDashboard(data);
      message.success('Prices updated');
    } catch {
      message.error('Price refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) return <Alert type="error" message={error} />;

  const { netWorth, accounts, positions, priceInfo } = dashboard;

  // If user has shared portfolios to view, show tabs
  if (shares.length > 0) {
    const tabItems = [
      {
        key: 'mine',
        label: 'My Portfolio',
        children: (
          <PortfolioView
            netWorth={netWorth}
            accounts={accounts}
            positions={positions}
            priceInfo={priceInfo}
            isMobile={isMobile}
            refreshing={refreshing}
            onRefresh={handleRefreshPrices}
            isOwn={true}
          />
        ),
      },
      ...shares.map(share => ({
        key: share.owner_user_id,
        label: `${share.owner_name}'s Portfolio`,
        children: sharedDashboards[share.owner_user_id] ? (
          <PortfolioView
            netWorth={sharedDashboards[share.owner_user_id].dashboard.netWorth}
            accounts={sharedDashboards[share.owner_user_id].dashboard.accounts}
            positions={sharedDashboards[share.owner_user_id].dashboard.positions}
            priceInfo={sharedDashboards[share.owner_user_id].dashboard.priceInfo}
            isMobile={isMobile}
            readOnly
          />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ),
      })),
    ];

    return (
      <div>
        <Title level={4} style={{ color: '#fff', marginBottom: 16, marginTop: 0 }}>
          Portfolio Overview
        </Title>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            if (key !== 'mine') loadSharedDashboard(key);
          }}
          items={tabItems}
        />
      </div>
    );
  }

  // No shares — show portfolio directly without tabs
  return (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: 20, marginTop: 0 }}>
        Portfolio Overview
      </Title>
      <PortfolioView
        netWorth={netWorth}
        accounts={accounts}
        positions={positions}
        priceInfo={priceInfo}
        isMobile={isMobile}
        refreshing={refreshing}
        onRefresh={handleRefreshPrices}
        isOwn={true}
      />
    </div>
  );
};

export default Dashboard;
