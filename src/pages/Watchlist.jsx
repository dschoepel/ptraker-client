import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Typography, Tag, Space,
  Popconfirm, Alert, Spin, Modal, Form, Tooltip, AutoComplete,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined
} from '@ant-design/icons';
import { AreaChart, Area, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { watchlistService } from '../services/dashboard.service';
import { formatCurrency, formatPercent, gainLossColor } from '../utils/formatters';
import useMessage from '../hooks/useMessage';
import { brandColors } from '../theme';
import api from '../services/api';

const { Title, Text } = Typography;

// =============================================================================
// Sparkline — mini price chart for the last 30 days
// =============================================================================
const Sparkline = ({ ticker }) => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/watchlist/${ticker}/history?days=30`);
        if (!cancelled) setData(response.data.history || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchHistory();
    return () => { cancelled = true; };
  }, [ticker]);

  if (loading) return (
    <div style={{ width: 120, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="small" />
    </div>
  );
  if (data.length < 2) return <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>—</Text>;

  const isUp = data[data.length - 1].close >= data[0].close;
  const lineColor = isUp ? brandColors.gain : brandColors.loss;
  
  // Calculate min/max with padding to amplify small movements
  const closes = data.map(d => d.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const padding = (max - min) * 0.3 || max * 0.01;

  return (
    <ResponsiveContainer width={120} height={50}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={[min - padding, max + padding]} hide />
        <Area
          type="monotone"
          dataKey="close"
          stroke={lineColor}
          strokeWidth={1.5}
          fill={`url(#grad-${ticker})`}
          dot={false}
          isAnimationActive={false}
        />
        <RechartsTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={{
                background: brandColors.darkCard,
                border: `1px solid ${brandColors.darkBorder}`,
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 11,
              }}>
                <Text style={{ color: '#fff' }}>{formatCurrency(payload[0].value)}</Text>
                <Text style={{ color: brandColors.textMuted, display: 'block' }}>{payload[0].payload.date}</Text>
              </div>
            );
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// =============================================================================
// Sub-components
// =============================================================================
const GainLossIndicator = ({ value }) => {
  if (value === null || value === undefined) return <MinusOutlined style={{ color: brandColors.neutral }} />;
  if (value > 0) return <ArrowUpOutlined style={{ color: brandColors.gain }} />;
  if (value < 0) return <ArrowDownOutlined style={{ color: brandColors.loss }} />;
  return <MinusOutlined style={{ color: brandColors.neutral }} />;
};

const AddTickerModal = ({ open, onClose, onAdd, loading }) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (value) => {
    if (value.length < 2) { setOptions([]); return; }
    setSearching(true);
    try {
      const response = await api.get(`/watchlist/search?q=${encodeURIComponent(value)}`);
      setOptions(
        (response.data.results || []).map(r => ({
          value: r.ticker,
          label: (
            <Space>
              <Text style={{ color: '#fff', fontWeight: 600 }}>{r.ticker}</Text>
              <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>{r.name}</Text>
              <Tag style={{ fontSize: 10 }}>{r.exchDisp}</Tag>
            </Space>
          ),
          name: r.name,
        }))
      );
    } catch {
      setOptions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (value, option) => {
    form.setFieldsValue({
      ticker: value,
      assetName: option.name,
    });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onAdd(values);
      form.resetFields();
      setOptions([]);
    } catch {
      // validation error shown inline
    }
  };

  return (
    <Modal
      title={<Text style={{ color: '#fff', fontWeight: 600 }}>Add to Watchlist</Text>}
      open={open}
      onCancel={() => { onClose(); setOptions([]); }}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Add"
      okButtonProps={{ style: { fontWeight: 600 } }}
    >
      <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
        <Form.Item
          name="ticker"
          label="Ticker Symbol or Company Name"
          rules={[{ required: true, message: 'Ticker is required' }]}
        >
          <AutoComplete
            options={options}
            onSearch={handleSearch}
            onSelect={handleSelect}
            placeholder="e.g. AAPL or Apple"
            style={{ width: '100%', textTransform: 'uppercase' }}
            autoFocus
          />
        </Form.Item>
        <Form.Item name="assetName" label="Name (auto-filled on selection)">
          <Input placeholder="e.g. Apple Inc." />
        </Form.Item>
        <Form.Item name="notes" label="Notes (optional)">
          <Input.TextArea placeholder="Why are you watching this?" rows={2} maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const EditNotesModal = ({ open, item, onClose, onSave, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && item) {
      form.setFieldsValue({ notes: item.notes || '' });
    }
  }, [open, item, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values.notes);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      title={<Text style={{ color: '#fff', fontWeight: 600 }}>Edit Notes — {item?.ticker}</Text>}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Save"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} maxLength={500} autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// =============================================================================
// Watchlist Page
// =============================================================================
const Watchlist = () => {
  const [watchlist, setWatchlist]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [saving, setSaving]             = useState(false);
  const [refreshKey, setRefreshKey]     = useState(0);
  const message = useMessage();

  useEffect(() => {
    let cancelled = false;

    const fetchWatchlist = async () => {
      try {
        setLoading(true);
        const data = await watchlistService.getAll();
        if (!cancelled) setWatchlist(data.watchlist || []);
      } catch {
        if (!cancelled) setError('Failed to load watchlist');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWatchlist();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleAdd = async (values) => {
    setSaving(true);
    try {
      await watchlistService.add(values.ticker, values.assetName, undefined, values.notes, 'manual');
      message.success(`${values.ticker.toUpperCase()} added to watchlist`);
      setAddModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to add ticker');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async (notes) => {
    setSaving(true);
    try {
      await watchlistService.update(editItem.ticker, notes);
      message.success('Notes updated');
      setEditItem(null);
      setRefreshKey(k => k + 1);
    } catch {
      message.error('Failed to update notes');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (ticker) => {
    try {
      await watchlistService.remove(ticker);
      message.success(`${ticker} removed from watchlist`);
      setRefreshKey(k => k + 1);
    } catch {
      message.error('Failed to remove ticker');
    }
  };

  const columns = [
    {
      title: 'Ticker',
      dataIndex: 'ticker',
      key: 'ticker',
      width: 160,
      render: (val, row) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{val}</Text>
          {row.asset_name && (
            <Text style={{
              color: brandColors.textMuted,
              fontSize: 11,
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
            title={row.asset_name}
            >
              {row.asset_name}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '30d',
      key: 'sparkline',
      width: 110,
      render: (_, row) => (
        <Sparkline ticker={row.ticker} changePercent={row.change_percent} />
      ),
    },
    {
      title: 'Price',
      dataIndex: 'current_price',
      key: 'current_price',
      width: 120,
      align: 'right',
      render: (val, row) => (
        val ? (
          <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
            <Text style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(val)}</Text>
            <Space size={4}>
              <GainLossIndicator value={row.change_percent} />
              <Text style={{ fontSize: 12, color: gainLossColor(row.change_percent) }}>
                {formatPercent(row.change_percent)}
              </Text>
            </Space>
          </Space>
        ) : (
          <Text style={{ color: brandColors.textMuted }}>—</Text>
        )
      ),
    },
    {
      title: 'Added',
      dataIndex: 'added_at',
      key: 'added_at',
      width: 130,
      render: (val, row) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>
            {new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          {row.added_from === 'import_sync' && (
            <Tag color="default" style={{ fontSize: 10 }}>from import</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (val) => (
        <Text style={{ color: brandColors.textMuted, fontSize: 13 }}>{val || '—'}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit notes">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              style={{ color: brandColors.textSecondary }}
              onClick={() => setEditItem(record)}
            />
          </Tooltip>
          <Tooltip title="Remove">
            <Popconfirm
              title={`Remove ${record.ticker} from watchlist?`}
              onConfirm={() => handleRemove(record.ticker)}
              okText="Remove"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: brandColors.darkBg,
        paddingTop: 4,
        paddingBottom: 12,
      }}>
        <Title level={4} style={{ color: '#fff', margin: 0 }}>
          Watchlist
          <Text style={{ color: brandColors.textMuted, fontSize: 13, marginLeft: 8, fontWeight: 400 }}>
            ({watchlist.length} {watchlist.length === 1 ? 'ticker' : 'tickers'})
          </Text>
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalOpen(true)}
          style={{ fontWeight: 600 }}
        >
          Add Ticker
        </Button>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} closable />}

      {watchlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text style={{ fontSize: 16, color: brandColors.textMuted, display: 'block', marginBottom: 8 }}>
            No tickers on your watchlist yet
          </Text>
          <Text style={{ fontSize: 13, color: brandColors.textMuted }}>
            Add tickers manually or they'll appear automatically when you sync-delete positions during import
          </Text>
        </div>
      ) : (
        <Table
          dataSource={watchlist}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          style={{ borderRadius: 8, overflow: 'hidden' }}
          sticky
        />
      )}

      <AddTickerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAdd}
        loading={saving}
      />

      <EditNotesModal
        open={!!editItem}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={handleSaveNotes}
        loading={saving}
      />
    </div>
  );
};

export default Watchlist;
