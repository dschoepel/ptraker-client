import { useState, useEffect, useCallback } from 'react';
import {
  Row, Col, Card, Statistic, Table, Tag, Typography,
  Spin, Alert, Grid, Space, Collapse, Tabs,
  Button, Checkbox, Select,
} from 'antd';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip as ReTooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import {
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined,
  RightOutlined, ReloadOutlined, CrownOutlined, FilterOutlined,
} from '@ant-design/icons';
import { dashboardService, priceService } from '../services/dashboard.service';
import { sharesService } from '../services/admin.service';
import {
  formatCurrency, formatPercent, formatShares,
  formatDateTime, gainLossColor, institutionName, accountTypeName, assetTypeName,
} from '../utils/formatters';
import { brandColors } from '../theme';
import { useAuth } from '../store/useAuth';
import useMessage from '../hooks/useMessage';

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
          style={{ color: '#fff', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200, display: 'block' }}
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
              {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`}
            </Text>
            <Text style={{ color: freshnessColor, fontSize: 11 }}>
              {new Date(account.last_imported_at).toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit',
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
    title: 'Ticker', dataIndex: 'ticker', key: 'ticker', width: 110,
    render: (val, row) => (
      <Space orientation="vertical" size={0}>
        <Text style={{ color: '#fff', fontWeight: 600 }}>{val}</Text>
        <Text style={{ color: brandColors.textMuted, fontSize: 11, maxWidth: 100,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
          title={row.asset_name}>
          {row.asset_name}
        </Text>
      </Space>
    ),
  },
  {
    title: 'Type', dataIndex: 'asset_type', key: 'asset_type', width: 90,
    render: (val) => <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>{assetTypeName(val)}</Text>,
  },
  {
    title: 'Shares', dataIndex: 'shares', key: 'shares', width: 90, align: 'right',
    render: (val) => <Text style={{ color: brandColors.textSecondary }}>{formatShares(val)}</Text>,
  },
  {
    title: 'Price', dataIndex: 'current_price', key: 'current_price', width: 100, align: 'right',
    render: (val, row) => (
      <Space orientation="vertical" size={0} style={{ textAlign: 'right' }}>
        <Text style={{ color: '#fff' }}>{formatCurrency(val)}</Text>
        <Text style={{ fontSize: 11, color: gainLossColor(row.change_percent) }}>
          {formatPercent(row.change_percent)}
        </Text>
      </Space>
    ),
  },
  {
    title: 'Value', dataIndex: 'current_value', key: 'current_value', width: 115, align: 'right',
    sorter: (a, b) => (a.current_value || 0) - (b.current_value || 0),
    render: (val) => <Text style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(val)}</Text>,
  },
  {
    title: 'Cost', dataIndex: 'cost_basis', key: 'cost_basis', width: 110, align: 'right',
    render: (val) => <Text style={{ color: brandColors.textSecondary }}>{formatCurrency(val)}</Text>,
  },
  {
    title: 'Gain/Loss', dataIndex: 'gain_loss', key: 'gain_loss', width: 135, align: 'right',
    sorter: (a, b) => (a.gain_loss || 0) - (b.gain_loss || 0),
    render: (val, row) => {
      if (row.asset_type === 'cash') return <Text style={{ color: brandColors.neutral }}>—</Text>;
      return (
        <Space orientation="vertical" size={0} style={{ textAlign: 'right' }}>
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
    title: 'Today', dataIndex: 'days_change', key: 'days_change', width: 100, align: 'right',
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
// =============================================================================
// AnalyticsView — charts: institution, account type, cash/liquidity
// =============================================================================

// Palette for chart segments — cycles through these
const CHART_COLORS = [
  '#f5a623', '#4a9eff', '#7ed321', '#d0021b', '#9b59b6',
  '#1abc9c', '#e67e22', '#3498db', '#e74c3c', '#2ecc71',
];

// Recharts custom tooltip
const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1a1d23', border: `1px solid ${brandColors.darkBorder}`,
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      {label && <div style={{ color: brandColors.textMuted, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#fff' }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

const AnalyticsView = ({ accounts, positions }) => {
  // ---- Derive institution data from accounts --------------------------------
  const institutionMap = {};
  accounts.forEach(a => {
    const inst = a.institution || 'other';
    if (!institutionMap[inst]) institutionMap[inst] = { value: 0, cost: 0, cash: 0 };
    institutionMap[inst].value += a.total_current_value || 0;
    institutionMap[inst].cost  += a.total_cost_basis    || 0;
    // Cash: checking/savings accounts OR CASH positions
    if (['checking', 'savings'].includes(a.account_type)) {
      institutionMap[inst].cash += a.total_current_value || 0;
    }
  });
  // Add CASH positions from investment accounts to cash tally
  positions.forEach(p => {
    if (p.asset_type === 'cash' && !['checking','savings'].includes(
      accounts.find(a => a.account_id === p.account_id)?.account_type
    )) {
      const inst = accounts.find(a => a.account_id === p.account_id)?.institution || 'other';
      if (institutionMap[inst]) institutionMap[inst].cash += p.current_value || 0;
    }
  });

  const institutionData = Object.entries(institutionMap).map(([inst, d]) => ({
    name: institutionName(inst),
    value: d.value,
    gainLoss: d.value - d.cost,
    gainLossPct: d.cost > 0 ? ((d.value - d.cost) / d.cost) * 100 : 0,
    cash: d.cash,
  })).sort((a, b) => b.value - a.value);

  // ---- Account type data ---------------------------------------------------
  const typeMap = {};
  accounts.forEach(a => {
    const type = a.account_type || 'other';
    if (!typeMap[type]) typeMap[type] = 0;
    typeMap[type] += a.total_current_value || 0;
  });
  const accountTypeData = Object.entries(typeMap).map(([type, value]) => ({
    name: accountTypeName(type),
    value,
  })).sort((a, b) => b.value - a.value);

  // ---- Cash / liquidity data -----------------------------------------------
  const totalCash = institutionData.reduce((s, d) => s + d.cash, 0);
  const cashData = institutionData.filter(d => d.cash > 0);

  const totalValue = institutionData.reduce((s, d) => s + d.value, 0);

  const cardStyle = { borderColor: brandColors.darkBorder, marginBottom: 20 };
  const titleStyle = { color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 16 };

  // Custom donut label
  const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 28;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill={brandColors.textSecondary} textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central" fontSize={11}>
        {name} ({(percent * 100).toFixed(0)}%)
      </text>
    );
  };

  return (
    <div>
      <Row gutter={[16, 0]}>
        {/* ---- Institution ------------------------------------------------ */}
        <Col xs={24} xl={12}>
          <Card size="small" style={cardStyle}>
            <div style={titleStyle}>By Institution</div>
            <Row gutter={[16, 0]}>
              {/* Donut — value allocation */}
              <Col xs={24} sm={12}>
                <Text style={{ color: brandColors.textMuted, fontSize: 11, display: 'block', marginBottom: 8 }}>
                  VALUE ALLOCATION
                </Text>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={institutionData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      dataKey="value" labelLine={false} label={renderPieLabel}>
                      {institutionData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip content={<ChartTooltip formatter={formatCurrency} />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ marginTop: 4 }}>
                  {institutionData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Space size={6}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                        <Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>{d.name}</Text>
                      </Space>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                        {formatCurrency(d.value)}
                      </Text>
                    </div>
                  ))}
                </div>
              </Col>
              {/* Bar — gain/loss */}
              <Col xs={24} sm={12}>
                <Text style={{ color: brandColors.textMuted, fontSize: 11, display: 'block', marginBottom: 8 }}>
                  GAIN / LOSS
                </Text>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={institutionData} layout="vertical" margin={{ left: 0, right: 40, top: 4, bottom: 4 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={70} tick={{ fill: brandColors.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <ReTooltip content={
                      <ChartTooltip formatter={(v) => `${formatCurrency(v)}`} />
                    } />
                    <Bar dataKey="gainLoss" radius={[0, 4, 4, 0]} minPointSize={3}>
                      {institutionData.map((d, i) => (
                        <Cell key={i} fill={d.gainLoss >= 0 ? brandColors.gain : brandColors.loss} />
                      ))}
                      <LabelList dataKey="gainLoss" position="right"
                        style={{ fill: brandColors.textSecondary, fontSize: 11 }}
                        formatter={formatCurrency} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* % table */}
                <div style={{ marginTop: 4 }}>
                  {institutionData.map((d) => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>{d.name}</Text>
                      <Text style={{ color: gainLossColor(d.gainLossPct), fontSize: 12, fontWeight: 600 }}>
                        {d.gainLossPct >= 0 ? '+' : ''}{d.gainLossPct.toFixed(1)}%
                      </Text>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* ---- Account Type ----------------------------------------------- */}
        <Col xs={24} xl={12}>
          <Card size="small" style={cardStyle}>
            <div style={titleStyle}>By Account Type</div>
            <Text style={{ color: brandColors.textMuted, fontSize: 11, display: 'block', marginBottom: 8 }}>
              VALUE ALLOCATION
            </Text>
            <Row gutter={[16, 0]} align="middle">
              <Col xs={24} sm={12}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={accountTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      dataKey="value" labelLine={false} label={renderPieLabel}>
                      {accountTypeData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip content={<ChartTooltip formatter={formatCurrency} />} />
                  </PieChart>
                </ResponsiveContainer>
              </Col>
              <Col xs={24} sm={12}>
                {accountTypeData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Space size={6}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>{d.name}</Text>
                    </Space>
                    <Space orientation="vertical" size={0} style={{ textAlign: 'right' }}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{formatCurrency(d.value)}</Text>
                      <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>
                        {totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%
                      </Text>
                    </Space>
                  </div>
                ))}
              </Col>
            </Row>
          </Card>
        </Col>

        {/* ---- Cash & Liquidity ------------------------------------------- */}
        <Col xs={24}>
          <Card size="small" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={titleStyle}>Cash & Liquidity</div>
              <Space orientation="vertical" size={0} style={{ textAlign: 'right' }}>
                <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>TOTAL LIQUID</Text>
                <Text style={{ color: brandColors.gold, fontSize: 22, fontWeight: 700 }}>
                  {formatCurrency(totalCash)}
                </Text>
                <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>
                  {totalValue > 0 ? ((totalCash / totalValue) * 100).toFixed(1) : 0}% of portfolio
                </Text>
              </Space>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(120, cashData.length * 52)}>
              <BarChart data={cashData} layout="vertical" margin={{ left: 8, right: 80, top: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120}
                  tick={{ fill: brandColors.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                <ReTooltip content={<ChartTooltip formatter={formatCurrency} />} />
                <Bar dataKey="cash" fill={brandColors.gold} radius={[0, 4, 4, 0]} minPointSize={4}>
                  <LabelList dataKey="cash" position="right"
                    style={{ fill: '#fff', fontSize: 12, fontWeight: 600 }}
                    formatter={formatCurrency} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// PortfolioView — reusable portfolio display (own + shared)
// =============================================================================
const PortfolioView = ({
  netWorth, accounts, positions, priceInfo, isMobile,
  refreshing, onRefresh, readOnly = false, isOwn = false, isViewer = false,
}) => {
  const [filtersOpen, setFiltersOpen]               = useState(false);
  const [selectedAccounts, setSelectedAccounts]     = useState([]);
  const [selectedInstitutions, setSelectedInstitutions] = useState([]);
  const [sortBy, setSortBy]                         = useState('value_desc');

  // Show empty state for viewer with no own accounts
  if (isOwn && isViewer && (!accounts || accounts.length === 0)) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{
          background: brandColors.darkCard, border: `1px solid ${brandColors.darkBorder}`,
          borderRadius: 12, padding: 40, maxWidth: 480, margin: '0 auto',
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
            onClick={() => { window.location.href = '/profile'; }}
            style={{ fontWeight: 600 }}
          >
            Request Full Access
          </Button>
        </div>
      </div>
    );
  }

  // Build filtered + sorted account list
  const filteredAccounts = (accounts || [])
    .filter(a => selectedAccounts.length === 0 || selectedAccounts.includes(a.account_id))
    .filter(a => selectedInstitutions.length === 0 || selectedInstitutions.includes(a.institution))
    .sort((a, b) => {
      if (sortBy === 'value_desc') return (b.total_current_value || 0) - (a.total_current_value || 0);
      if (sortBy === 'gain_desc')  return (b.total_gain_loss || 0) - (a.total_gain_loss || 0);
      if (sortBy === 'name_asc')   return a.account_name.localeCompare(b.account_name);
      return 0;
    });

  const institutions = [...new Set((accounts || []).map(a => a.institution))];
  const hasFilters = selectedAccounts.length > 0 || selectedInstitutions.length > 0 || sortBy !== 'value_desc';

  const positionsByAccount = (positions || []).reduce((acc, pos) => {
    if (!acc[pos.account_id]) acc[pos.account_id] = [];
    acc[pos.account_id].push(pos);
    return acc;
  }, {});

  const collapseItems = filteredAccounts.map(account => ({
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
      marginBottom: 8, borderRadius: 8,
      border: `1px solid ${brandColors.darkBorder}`, overflow: 'hidden',
    },
  }));

  return (
    <div>
      <SummaryCards netWorth={netWorth} priceInfo={priceInfo} isMobile={isMobile} />

      {/* Accounts header + filter controls */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <Title level={5} style={{ color: brandColors.textSecondary, margin: 0 }}>
          Accounts
          <Text style={{ color: brandColors.textMuted, fontSize: 13, marginLeft: 8, fontWeight: 400 }}>
            ({filteredAccounts.length} of {(accounts || []).length} accounts · {
              filteredAccounts.reduce((sum, a) => sum + (a.position_count || 0), 0)
            } holdings)
          </Text>
        </Title>
        <Space wrap size={8}>
          {priceInfo?.newestPriceAt && (
            <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
              Prices as of {formatDateTime(priceInfo.newestPriceAt)}
            </Text>
          )}
          <Button
            type={hasFilters ? 'primary' : 'text'}
            icon={<FilterOutlined />}
            size="small"
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{ color: hasFilters ? undefined : brandColors.textSecondary }}
          >
            {hasFilters ? 'Filtered' : 'Filter'}
          </Button>
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

      {/* Filter panel */}
      {filtersOpen && (
        <div style={{
          background: brandColors.darkCard, border: `1px solid ${brandColors.darkBorder}`,
          borderRadius: 8, padding: 16, marginBottom: 16,
        }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block', marginBottom: 8 }}>
                Sort By
              </Text>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: '100%' }}
                size="small"
                options={[
                  { value: 'value_desc', label: 'Value — highest first' },
                  { value: 'gain_desc',  label: 'Gain/Loss — highest first' },
                  { value: 'name_asc',   label: 'Name — A to Z' },
                ]}
              />
            </Col>
            <Col xs={24} md={8}>
              <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block', marginBottom: 8 }}>
                Institution
              </Text>
              <Checkbox.Group
                value={selectedInstitutions}
                onChange={setSelectedInstitutions}
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                {institutions.map(inst => (
                  <Checkbox key={inst} value={inst} style={{ color: brandColors.textSecondary }}>
                    {institutionName(inst)}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </Col>
            <Col xs={24} md={8}>
              <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block', marginBottom: 8 }}>
                Accounts
              </Text>
              <Checkbox.Group
                value={selectedAccounts}
                onChange={setSelectedAccounts}
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                {(accounts || []).map(a => (
                  <Checkbox key={a.account_id} value={a.account_id} style={{ color: brandColors.textSecondary }}>
                    {a.account_name}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </Col>
          </Row>
          {hasFilters && (
            <Button
              size="small"
              type="link"
              onClick={() => { setSelectedAccounts([]); setSelectedInstitutions([]); setSortBy('value_desc'); }}
              style={{ color: brandColors.textMuted, padding: '8px 0 0' }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      <Collapse
        ghost
        defaultActiveKey={[]}
        expandIcon={({ isActive }) => (
          <RightOutlined
            style={{
              color: brandColors.textMuted, fontSize: 12,
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
  const [dashboard, setDashboard]               = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [shares, setShares]                     = useState([]);
  const [sharedDashboards, setSharedDashboards] = useState({});
  const [activeTab, setActiveTab]               = useState('mine');
  const [refreshing, setRefreshing]             = useState(false);
  const screens                                 = useBreakpoint();
  const isMobile                                = !screens.md;
  const message = useMessage();
  const { user }                                = useAuth();
  const isViewer = user?.role === 'viewer' || user?.user_metadata?.role === 'viewer';

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

  useEffect(() => {
    const autoSwitch = async () => {
      if (!loading && shares.length > 0 && dashboard &&
          (!dashboard.accounts || dashboard.accounts.length === 0)) {
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

  if (shares.length > 0) {
    const tabItems = [
      {
        key: 'mine',
        label: 'My Portfolio',
        children: (
          <PortfolioView
            netWorth={netWorth} accounts={accounts} positions={positions}
            priceInfo={priceInfo} isMobile={isMobile} refreshing={refreshing}
            onRefresh={handleRefreshPrices} isOwn isViewer={isViewer}
          />
        ),
      },
      {
        key: 'analytics',
        label: 'Analytics',
        children: <AnalyticsView accounts={accounts} positions={positions} />,
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
            isMobile={isMobile} readOnly
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
            if (key !== 'mine' && key !== 'analytics') loadSharedDashboard(key);
          }}
          items={tabItems}
        />
      </div>
    );
  }

  return (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: 16, marginTop: 0 }}>
        Portfolio Overview
      </Title>
      <Tabs
        defaultActiveKey="portfolio"
        items={[
          {
            key: 'portfolio',
            label: 'My Portfolio',
            children: (
              <PortfolioView
                netWorth={netWorth} accounts={accounts} positions={positions}
                priceInfo={priceInfo} isMobile={isMobile} refreshing={refreshing}
                onRefresh={handleRefreshPrices} isOwn isViewer={isViewer}
              />
            ),
          },
          {
            key: 'analytics',
            label: 'Analytics',
            children: <AnalyticsView accounts={accounts} positions={positions} />,
          },
        ]}
      />
    </div>
  );
};

export default Dashboard;
