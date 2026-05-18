import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Typography,
  Spin,
  Alert,
  Grid,
  Space,
  Collapse,
  App as AntdApp,
  Button,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  RightOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { dashboardService } from "../services/dashboard.service";
import { priceService } from "../services/dashboard.service";
import {
  formatCurrency,
  formatPercent,
  formatShares,
  formatDateTime,
  gainLossColor,
  institutionName,
  assetTypeName,
} from "../utils/formatters";
import { brandColors } from "../theme";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// =============================================================================
// Sub-components — defined OUTSIDE Dashboard
// =============================================================================

const GainLossIndicator = ({ value }) => {
  if (value === null || value === undefined)
    return <MinusOutlined style={{ color: brandColors.neutral }} />;
  if (value > 0) return <ArrowUpOutlined style={{ color: brandColors.gain }} />;
  if (value < 0)
    return <ArrowDownOutlined style={{ color: brandColors.loss }} />;
  return <MinusOutlined style={{ color: brandColors.neutral }} />;
};

const ColoredValue = ({ value, formatter = formatCurrency }) => {
  if (value === null || value === undefined)
    return <span style={{ color: brandColors.neutral }}>—</span>;
  const color = gainLossColor(value);
  return <span style={{ color }}>{formatter(value)}</span>;
};

const SummaryCards = ({ netWorth, priceInfo, isMobile }) => (
  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
    <Col xs={12} sm={12} md={6}>
      <Card size="small" style={{ borderColor: brandColors.darkBorder }}>
        <Statistic
          title={
            <Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>
              Total Value
            </Text>
          }
          value={netWorth?.total_current_value || 0}
          precision={2}
          styles={{
            content: {
              color: "#fff",
              fontSize: isMobile ? 18 : 26,
              fontWeight: 700,
            },
          }}
          formatter={(val) =>
            `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
        />
      </Card>
    </Col>
    <Col xs={12} sm={12} md={6}>
      <Card size="small" style={{ borderColor: brandColors.darkBorder }}>
        <Statistic
          title={
            <Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>
              Total Cost
            </Text>
          }
          value={netWorth?.total_cost_basis || 0}
          precision={2}
          styles={{
            content: {
              color: brandColors.textSecondary,
              fontSize: isMobile ? 18 : 26,
            },
          }}
          formatter={(val) =>
            `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
        />
      </Card>
    </Col>
    <Col xs={12} sm={12} md={6}>
      <Card size="small" style={{ borderColor: brandColors.darkBorder }}>
        <Statistic
          title={
            <Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>
              Total Gain/Loss
            </Text>
          }
          value={netWorth?.total_gain_loss || 0}
          precision={2}
          styles={{
            content: {
              color: gainLossColor(netWorth?.total_gain_loss),
              fontSize: isMobile ? 18 : 26,
              fontWeight: 600,
            },
          }}
          formatter={(val) => {
            const v = Number(val);
            const sign = v >= 0 ? "+" : "-";
            return `${sign}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }}
          suffix={
            <Text
              style={{
                fontSize: 12,
                color: gainLossColor(netWorth?.total_gain_loss),
                marginLeft: 4,
              }}
            >
              ({formatPercent(netWorth?.total_gain_loss_percent)})
            </Text>
          }
        />
      </Card>
    </Col>
    <Col xs={12} sm={12} md={6}>
      <Card size="small" style={{ borderColor: brandColors.darkBorder }}>
        <Statistic
          title={
            <Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>
              Today's Change
            </Text>
          }
          value={netWorth?.total_days_change || 0}
          precision={2}
          styles={{
            content: {
              color: gainLossColor(netWorth?.total_days_change),
              fontSize: isMobile ? 18 : 26,
              fontWeight: 600,
            },
          }}
          formatter={(val) => {
            const v = Number(val);
            const sign = v >= 0 ? "+" : "-";
            return `${sign}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }}
        />
        {priceInfo?.newestPriceAt && (
          <Text
            style={{
              color: brandColors.textMuted,
              fontSize: 11,
              display: "block",
              marginTop: 4,
            }}
          >
            as of {formatDateTime(priceInfo.newestPriceAt)}
          </Text>
        )}
      </Card>
    </Col>
  </Row>
);

// Account collapse panel header — shows summary when collapsed
const AccountPanelHeader = ({ account }) => {
  const daysSince = account.last_imported_at
  ? Math.floor(
      (new Date().getTime() - new Date(account.last_imported_at).getTime())
      / (1000 * 60 * 60 * 24)
    )
  : null;

  const freshnessColor =
    daysSince === null
      ? brandColors.textMuted
      : daysSince === 0
        ? brandColors.gain
        : daysSince <= 7
          ? brandColors.textSecondary
          : "#faad14"; // yellow warning if older than a week

  return (
    <Row
      align="middle"
      gutter={[16, 0]}
      style={{ width: "100%", padding: "4px 0" }}
    >
      <Col xs={24} sm={7} md={5}>
        <Space size={8}>
          <Text style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
            {account.account_name}
          </Text>
          <Tag color="default" style={{ fontSize: 10 }}>
            {institutionName(account.institution)}
          </Tag>
        </Space>
      </Col>
      <Col xs={8} sm={4} md={3}>
        <Text
          style={{
            color: brandColors.textMuted,
            fontSize: 11,
            display: "block",
          }}
        >
          Value
        </Text>
        <Text style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>
          {formatCurrency(account.total_current_value)}
        </Text>
      </Col>
      <Col xs={8} sm={4} md={3}>
        <Text
          style={{
            color: brandColors.textMuted,
            fontSize: 11,
            display: "block",
          }}
        >
          Cost
        </Text>
        <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>
          {formatCurrency(account.total_cost_basis)}
        </Text>
      </Col>
      <Col xs={8} sm={4} md={3}>
        <Text
          style={{
            color: brandColors.textMuted,
            fontSize: 11,
            display: "block",
          }}
        >
          Gain/Loss
        </Text>
        <Space size={4}>
          <GainLossIndicator value={account.total_gain_loss} />
          <ColoredValue value={account.total_gain_loss} />
        </Space>
      </Col>
      <Col xs={0} sm={0} md={3}>
        <Text
          style={{
            color: brandColors.textMuted,
            fontSize: 11,
            display: "block",
          }}
        >
          Today
        </Text>
        <ColoredValue value={account.total_days_change} />
      </Col>
      <Col xs={0} sm={0} md={2}>
        <Text
          style={{
            color: brandColors.textMuted,
            fontSize: 11,
            display: "block",
          }}
        >
          Holdings
        </Text>
        <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>
          {account.position_count}
        </Text>
      </Col>
      <Col xs={0} sm={0} md={4}>
        <Text
          style={{
            color: brandColors.textMuted,
            fontSize: 11,
            display: "block",
          }}
        >
          Last Import
        </Text>
        {account.last_imported_at ? (
          <Space size={4}>
            <Text style={{ color: freshnessColor, fontSize: 12 }}>
              {daysSince === 0
                ? "Today"
                : daysSince === 1
                  ? "Yesterday"
                  : `${daysSince}d ago`}
            </Text>
            <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>
              {new Date(account.last_imported_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </Space>
        ) : (
          <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
            Never
          </Text>
        )}
      </Col>
    </Row>
  );
};

// Desktop positions table columns
const desktopColumns = [
  {
    title: "Ticker",
    dataIndex: "ticker",
    key: "ticker",
    width: 110,
    render: (val, row) => (
      <Space orientation="vertical" size={0}>
        <Text style={{ color: "#fff", fontWeight: 600 }}>{val}</Text>
        <Text
          style={{
            color: brandColors.textMuted,
            fontSize: 11,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 100,
            display: "block",
          }}
        >
          {row.asset_name
            ? row.asset_name.substring(0, 22) +
              (row.asset_name.length > 22 ? "…" : "")
            : ""}
        </Text>
      </Space>
    ),
  },
  {
    title: "Type",
    dataIndex: "asset_type",
    key: "asset_type",
    width: 90,
    render: (val) => (
      <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
        {assetTypeName(val)}
      </Text>
    ),
  },
  {
    title: "Shares",
    dataIndex: "shares",
    key: "shares",
    width: 90,
    align: "right",
    render: (val) => (
      <Text style={{ color: brandColors.textSecondary }}>
        {formatShares(val)}
      </Text>
    ),
  },
  {
    title: "Price",
    dataIndex: "current_price",
    key: "current_price",
    width: 100,
    align: "right",
    render: (val, row) => (
      <Space orientation="vertical" size={0} style={{ textAlign: "right" }}>
        <Text style={{ color: "#fff" }}>{formatCurrency(val)}</Text>
        <Text
          style={{ fontSize: 11, color: gainLossColor(row.change_percent) }}
        >
          {formatPercent(row.change_percent)}
        </Text>
      </Space>
    ),
  },
  {
    title: "Value",
    dataIndex: "current_value",
    key: "current_value",
    width: 115,
    align: "right",
    sorter: (a, b) => (a.current_value || 0) - (b.current_value || 0),
    render: (val) => (
      <Text style={{ color: "#fff", fontWeight: 600 }}>
        {formatCurrency(val)}
      </Text>
    ),
  },
  {
    title: "Cost",
    dataIndex: "cost_basis",
    key: "cost_basis",
    width: 110,
    align: "right",
    render: (val) => (
      <Text style={{ color: brandColors.textSecondary }}>
        {formatCurrency(val)}
      </Text>
    ),
  },
  {
    title: "Gain/Loss",
    dataIndex: "gain_loss",
    key: "gain_loss",
    width: 135,
    align: "right",
    sorter: (a, b) => (a.gain_loss || 0) - (b.gain_loss || 0),
    render: (val, row) => {
      if (row.asset_type === "cash")
        return <Text style={{ color: brandColors.neutral }}>—</Text>;
      return (
        <Space orientation="vertical" size={0} style={{ textAlign: "right" }}>
          <Space size={4}>
            <GainLossIndicator value={val} />
            <ColoredValue value={val} />
          </Space>
          <ColoredValue
            value={row.gain_loss_percent}
            formatter={formatPercent}
          />
        </Space>
      );
    },
  },
  {
    title: "Today",
    dataIndex: "days_change",
    key: "days_change",
    width: 100,
    align: "right",
    render: (val, row) => {
      if (row.asset_type === "cash")
        return <Text style={{ color: brandColors.neutral }}>—</Text>;
      return <ColoredValue value={val} />;
    },
  },
];

// Mobile position card
const MobilePositionCard = ({ position }) => (
  <Card
    size="small"
    style={{ marginBottom: 8, borderColor: brandColors.darkBorder }}
  >
    <Row justify="space-between" align="middle">
      <Col>
        <Space size={8}>
          <Text style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
            {position.ticker}
          </Text>
          <Tag style={{ fontSize: 10 }}>
            {assetTypeName(position.asset_type)}
          </Tag>
        </Space>
        <Text
          style={{
            color: brandColors.textSecondary,
            fontSize: 11,
            display: "block",
          }}
        >
          {position.asset_name}
        </Text>
      </Col>
      <Col style={{ textAlign: "right" }}>
        <Text
          style={{
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            display: "block",
          }}
        >
          {formatCurrency(position.current_value)}
        </Text>
        {position.asset_type !== "cash" && (
          <Space size={4}>
            <GainLossIndicator value={position.gain_loss} />
            <ColoredValue
              value={position.gain_loss_percent}
              formatter={formatPercent}
            />
          </Space>
        )}
      </Col>
    </Row>
    <Row justify="space-between" style={{ marginTop: 6 }}>
      <Col>
        <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>
          {formatShares(position.shares)} @{" "}
          {formatCurrency(position.current_price)}
        </Text>
      </Col>
      {position.asset_type !== "cash" && (
        <Col>
          <ColoredValue value={position.days_change} />
          <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>
            {" "}
            today
          </Text>
        </Col>
      )}
    </Row>
  </Card>
);

// Account section — positions table with summary footer
const AccountPositionsTable = ({ positions, accountSummary, isMobile }) => {
  if (isMobile) {
    return (
      <div style={{ padding: "8px 0" }}>
        {positions.map((p) => (
          <MobilePositionCard key={p.id} position={p} />
        ))}
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
              <Text
                style={{
                  color: brandColors.textSecondary,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                Account Total
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right">
              <Text style={{ color: "#fff", fontWeight: 700 }}>
                {formatCurrency(accountSummary.total_current_value)}
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5} align="right">
              <Text style={{ color: brandColors.textSecondary }}>
                {formatCurrency(accountSummary.total_cost_basis)}
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6} align="right">
              <ColoredValue value={accountSummary.total_gain_loss} />
            </Table.Summary.Cell>
            <Table.Summary.Cell index={7} align="right">
              <ColoredValue value={accountSummary.total_days_change} />
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  );
};

// =============================================================================
// Dashboard Page
// =============================================================================
const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [refreshing, setRefreshing] = useState(false);
  const { message } = AntdApp.useApp();

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      await priceService.refresh();
      // Reload dashboard data to show updated prices and timestamp
      const data = await dashboardService.getDashboard();
      setDashboard(data);
      message.success("Prices updated");
    } catch {
      message.error("Price refresh failed");
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboard();
        setDashboard(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  const { netWorth, accounts, positions, priceInfo } = dashboard;

  // Group positions by account_id
  const positionsByAccount = positions.reduce((acc, pos) => {
    if (!acc[pos.account_id]) acc[pos.account_id] = [];
    acc[pos.account_id].push(pos);
    return acc;
  }, {});

  // Build Collapse items — one panel per account
  const collapseItems = accounts.map((account) => ({
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
      overflow: "hidden",
    },
  }));

  return (
    <div>
      <Title
        level={4}
        style={{ color: "#fff", marginBottom: 20, marginTop: 0 }}
      >
        Portfolio Overview
      </Title>

      <SummaryCards
        netWorth={netWorth}
        priceInfo={priceInfo}
        isMobile={isMobile}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Title
          level={5}
          style={{ color: brandColors.textSecondary, margin: 0 }}
        >
          Accounts
          <Text
            style={{
              color: brandColors.textMuted,
              fontSize: 13,
              marginLeft: 8,
              fontWeight: 400,
            }}
          >
            ({accounts.length} accounts · {positions.length} holdings)
          </Text>
        </Title>
        <Space>
          {priceInfo?.newestPriceAt && (
            <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
              Prices as of {formatDateTime(priceInfo.newestPriceAt)}
            </Text>
          )}
          <Button
            type="text"
            icon={<ReloadOutlined spin={refreshing} />}
            loading={refreshing}
            onClick={handleRefreshPrices}
            style={{ color: brandColors.textSecondary }}
          >
            Refresh Prices
          </Button>
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
              transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        )}
        items={collapseItems}
        style={{ background: "transparent" }}
      />
    </div>
  );
};

export default Dashboard;
