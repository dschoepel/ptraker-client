import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Alert,
  Spin,
  App as AntdApp,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { accountService } from "../services/dashboard.service";
import { dashboardService, positionService } from "../services/dashboard.service";
import {
  formatCurrency,
  formatPercent,
  formatShares,
  gainLossColor,
  institutionName,
  accountTypeName,
  assetTypeName,
} from "../utils/formatters";
import { brandColors } from "../theme";

const { Title, Text } = Typography;
const { Option } = Select;
// const { useBreakpoint } = Grid;

// =============================================================================
// Sub-components — defined outside Accounts to avoid recreation on render
// =============================================================================

const GainLossText = ({ value, asPercent = false }) => {
  if (value === null || value === undefined)
    return <span style={{ color: brandColors.neutral }}>—</span>;
  const color = gainLossColor(value);
  const text = asPercent ? formatPercent(value) : formatCurrency(value);
  return <span style={{ color }}>{text}</span>;
};

// Expanded positions table shown when a row is expanded
const PositionsTable = ({ positions, loading, onDeletePosition }) => {
  if (loading) return <Spin size="small" style={{ padding: 16 }} />;
  if (!positions || positions.length === 0) {
    return (
      <Text
        style={{
          color: brandColors.textMuted,
          padding: "12px 16px",
          display: "block",
        }}
      >
        No positions in this account
      </Text>
    );
  }

  const columns = [
    {
      title: "Ticker",
      dataIndex: "ticker",
      key: "ticker",
      width: 100,
      render: (val, row) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: "#fff", fontWeight: 600 }}>{val}</Text>
          <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>
            {assetTypeName(row.asset_type)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Name",
      dataIndex: "asset_name",
      key: "asset_name",
      ellipsis: true,
      render: (val) => (
        <Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>
          {val}
        </Text>
      ),
    },
    {
      title: "Shares",
      dataIndex: "shares",
      key: "shares",
      width: 100,
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
      render: (val) => (
        <Text style={{ color: "#fff" }}>{formatCurrency(val)}</Text>
      ),
    },
    {
      title: "Value",
      dataIndex: "current_value",
      key: "current_value",
      width: 120,
      align: "right",
      render: (val) => (
        <Text style={{ color: "#fff", fontWeight: 600 }}>
          {formatCurrency(val)}
        </Text>
      ),
    },
    {
      title: "Gain/Loss",
      dataIndex: "gain_loss",
      key: "gain_loss",
      width: 140,
      align: "right",
      render: (val, row) => {
        if (row.asset_type === "cash")
          return <Text style={{ color: brandColors.neutral }}>—</Text>;
        return (
          <Space direction="vertical" size={0} style={{ textAlign: "right" }}>
            <GainLossText value={val} />
            <GainLossText value={row.gain_loss_percent} asPercent />
          </Space>
        );
      },
    },
    {
  title: '',
  key: 'actions',
  width: 50,
  align: 'center',
  render: (_, record) => (
    <Popconfirm
      title={`Remove ${record.ticker}?`}
      description="This will delete this position from the account."
      onConfirm={() => onDeletePosition(record.id)}
      okText="Delete"
      cancelText="Cancel"
      okButtonProps={{ danger: true }}
    >
      <Button
        type="text"
        icon={<DeleteOutlined />}
        size="small"
        danger
      />
    </Popconfirm>
  ),
},
  ];

  return (
    <Table
      dataSource={positions}
      columns={columns}
      rowKey="id"
      size="small"
      pagination={false}
      scroll={{ x: 700 }}
      style={{ margin: "0 0 8px 0" }}
    />
  );
};

// Account form modal — used for both create and edit
const AccountFormModal = ({
  open,
  onClose,
  onSave,
  initialValues,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValues || {
          name: "",
          institution: "",
          type: "brokerage",
          accountNumberLast4: "",
          notes: "",
        },
      );
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
      form.resetFields();
    } catch {
      // Validation failed — form shows errors inline
    }
  };

  return (
    <Modal
      title={
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>
          {initialValues?.id ? "Edit Account" : "Add Account"}
        </Text>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText={initialValues?.id ? "Save Changes" : "Add Account"}
      okButtonProps={{ style: { fontWeight: 600 } }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="name"
          label="Account Name"
          rules={[{ required: true, message: "Account name is required" }]}
        >
          <Input placeholder="e.g. Dave's Roth IRA" />
        </Form.Item>

        <Form.Item
          name="institution"
          label="Institution"
          rules={[{ required: true, message: "Institution is required" }]}
        >
          <Select placeholder="Select institution">
            <Option value="lpl">LPL Financial</Option>
            <Option value="merrill">Merrill Lynch</Option>
            <Option value="schwab">Schwab</Option>
            <Option value="cfcu">Community First CU</Option>
            <Option value="bank">Bank</Option>
            <Option value="manual">Manual Entry</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="type"
          label="Account Type"
          rules={[{ required: true, message: "Account type is required" }]}
        >
          <Select>
            <Option value="brokerage">Brokerage</Option>
            <Option value="retirement">Retirement</Option>
            <Option value="checking">Checking</Option>
            <Option value="savings">Savings</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="accountNumberLast4"
          label="Last 4 Digits (optional)"
          rules={[
            {
              pattern: /^\d{4}$/,
              message: "Must be exactly 4 digits",
            },
          ]}
        >
          <Input placeholder="1234" maxLength={4} style={{ width: 120 }} />
        </Form.Item>

        <Form.Item name="notes" label="Notes (optional)">
          <Input.TextArea
            placeholder="Any notes about this account"
            rows={2}
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// =============================================================================
// Accounts Page
// =============================================================================
const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [positions, setPositions] = useState({}); // keyed by account_id
  const [loading, setLoading] = useState(true);
  const [posLoading, setPosLoading] = useState({}); // keyed by account_id
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  // const screens = useBreakpoint();
  const { message } = AntdApp.useApp();
  const [refreshKey, setRefreshKey] = useState(0);
const triggerRefresh = () => setRefreshKey(k => k + 1);

  // Load accounts on mount
useEffect(() => {
  let cancelled = false;

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAll();
      if (!cancelled) setAccounts(data.accounts);
    } catch (err) {
      if (!cancelled) setError(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  fetchAccounts();

  // Cleanup — prevents setState being called if component unmounts
  // before the fetch completes
  return () => { cancelled = true; };
}, [refreshKey]); // Empty array — fetch once on mount

  // Load positions for an account when its row is expanded
  const loadPositions = useCallback(
    async (accountId) => {
      if (positions[accountId]) return; // already loaded

      setPosLoading((prev) => ({ ...prev, [accountId]: true }));
      try {
        const data = await dashboardService.getDashboard();
        // Filter positions for this account from the dashboard data
        const accountPositions = data.positions.filter(
          (p) => p.account_id === accountId,
        );
        setPositions((prev) => ({ ...prev, [accountId]: accountPositions }));
      } catch {
        setPositions((prev) => ({ ...prev, [accountId]: [] }));
      } finally {
        setPosLoading((prev) => ({ ...prev, [accountId]: false }));
      }
    },
    [positions],
  );

  const handleExpand = (expanded, record) => {
    if (expanded) {
      loadPositions(record.id);
    }
  };

  // Create or update account
  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (editingAccount?.id) {
        await accountService.update(editingAccount.id, values);
        message.success("Account updated");
      } else {
        await accountService.create(values);
        message.success("Account added");
      }
      setModalOpen(false);
      setEditingAccount(null);
      triggerRefresh();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (account) => {
    try {
      await accountService.update(account.id, { isActive: !account.is_active });
      message.success(
        account.is_active ? "Account deactivated" : "Account reactivated",
      );
      triggerRefresh();
    } catch {
      message.error("Failed to update account");
    }
  };

  // Delete account
  const handleDelete = async (account) => {
    try {
      await accountService.remove(account.id);
      message.success(`"${account.name}" deleted`);
      triggerRefresh();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  const handleDeletePosition = async (positionId) => {
  try {
    await positionService.remove(positionId);
    message.success('Position removed');
    // Clear cached positions so they reload on next expand
    setPositions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => { updated[k] = null; });
      return updated;
    });
    triggerRefresh();
  } catch {
    message.error('Failed to remove position');
  }
};

  const openAdd = () => {
    setEditingAccount(null);
    setModalOpen(true);
  };

  const openEdit = (account) => {
    setEditingAccount({
      id: account.id,
      name: account.name,
      institution: account.institution,
      type: account.type,
      accountNumberLast4: account.account_number_last4 || "",
      notes: account.notes || "",
    });
    setModalOpen(true);
  };

  // Table columns
  const columns = [
    {
      title: "Account Name",
      dataIndex: "name",
      key: "name",
      render: (val, row) => (
        <Space direction="vertical" size={0}>
          <Text
            style={{
              color: row.is_active ? "#fff" : brandColors.textMuted,
              fontWeight: 600,
            }}
          >
            {val}
          </Text>
          {!row.is_active && (
            <Tag color="default" style={{ fontSize: 10 }}>
              Inactive
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Institution",
      dataIndex: "institution",
      key: "institution",
      width: 160,
      render: (val) => (
        <Tag color="default" style={{ fontSize: 12 }}>
          {institutionName(val)}
        </Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (val) => (
        <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>
          {accountTypeName(val)}
        </Text>
      ),
    },
    {
      title: "Acct #",
      dataIndex: "account_number_last4",
      key: "account_number_last4",
      width: 80,
      align: "center",
      render: (val) => (
        <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
          {val ? `••••${val}` : "—"}
        </Text>
      ),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (val) => (
        <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
          {val || "—"}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEdit(record)}
              style={{ color: brandColors.textSecondary }}
            />
          </Tooltip>

          <Tooltip title={record.is_active ? "Deactivate" : "Reactivate"}>
            <Button
              type="text"
              icon={
                record.is_active ? <StopOutlined /> : <CheckCircleOutlined />
              }
              size="small"
              onClick={() => handleToggleActive(record)}
              style={{
                color: record.is_active
                  ? brandColors.textMuted
                  : brandColors.gain,
              }}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Popconfirm
              title="Delete account?"
              description={`This will permanently delete "${record.name}" and all its positions.`}
              onConfirm={() => handleDelete(record)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: brandColors.darkBg,
          paddingTop: 4,
          paddingBottom: 12,
        }}
      >
        <Title level={4} style={{ color: "#fff", margin: 0 }}>
          Accounts
          <Text
            style={{
              color: brandColors.textMuted,
              fontSize: 13,
              marginLeft: 8,
              fontWeight: 400,
            }}
          >
            ({accounts.length} accounts)
          </Text>
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAdd}
          style={{ fontWeight: 600 }}
        >
          Add Account
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      <Table
        dataSource={accounts}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        sticky
        scroll={{ x: 700, y: "calc(100vh - 160px)" }}
        style={{ borderRadius: 8, overflow: "hidden" }}
        expandable={{
          expandedRowKeys: expandedRows,
          onExpand: (expanded, record) => {
            setExpandedRows(
              expanded
                ? [...expandedRows, record.id]
                : expandedRows.filter((k) => k !== record.id),
            );
            handleExpand(expanded, record);
          },
          expandedRowRender: (record) => (
            <PositionsTable
              positions={positions[record.id]}
              loading={posLoading[record.id]}
              onDeletePosition={handleDeletePosition}  // ← pass it as prop
            />
          ),
          rowExpandable: () => true,
        }}
        rowClassName={(record) => (!record.is_active ? "row-inactive" : "")}
      />

      <AccountFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSave}
        initialValues={editingAccount}
        loading={saving}
      />
    </div>
  );
};

export default Accounts;
