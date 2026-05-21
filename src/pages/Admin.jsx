import { useState, useEffect } from 'react';
import {
  Typography, Card, Table, Button, Tag, Space, Modal, Form,
  Input, Select, Spin, Switch, Collapse,
   Badge,  Tooltip, Popconfirm
} from 'antd';
import {
  UserAddOutlined, CheckOutlined, CloseOutlined,
  BellOutlined, MailOutlined, SendOutlined, TeamOutlined,
  CrownOutlined, EyeOutlined, UserOutlined, DeleteOutlined
} from '@ant-design/icons';
import { adminService } from '../services/admin.service';
import { brandColors } from '../theme';
import { formatDateTime } from '../utils/formatters';
import useMessage from '../hooks/useMessage';

const { Title, Text } = Typography;
const { Option } = Select;


// =============================================================================
// Role badge
// =============================================================================
const RoleBadge = ({ role }) => {
  const config = {
    admin:  { color: 'gold',    icon: <CrownOutlined />,  label: 'Admin'  },
    user:   { color: 'blue',    icon: <UserOutlined />,   label: 'User'   },
    viewer: { color: 'default', icon: <EyeOutlined />,    label: 'Viewer' },
  };
  const { color, icon, label } = config[role] || config.user;
  return <Tag color={color} icon={icon}>{label}</Tag>;
};

// =============================================================================
// Invite User Modal
// =============================================================================
const InviteModal = ({ open, onClose, onInvite, loading }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onInvite(values.email, values.role);
      form.resetFields();
    } catch {
      // validation shown inline
    }
  };

  return (
    <Modal
      title={<Text style={{ color: '#fff', fontWeight: 600 }}>Invite New User</Text>}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Send Invitation"
      okButtonProps={{ style: { fontWeight: 600 } }}
    >
      <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email' },
          ]}
        >
          <Input placeholder="user@example.com" size="large" autoFocus />
        </Form.Item>
        <Form.Item
          name="role"
          label="Role"
          initialValue="user"
          rules={[{ required: true }]}
          extra={
            <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
              User: full access to own portfolio. Viewer: read-only access to shared portfolios.
            </Text>
          }
        >
          <Select size="large">
            <Option value="user">User — full portfolio access</Option>
            <Option value="viewer">Viewer — read-only access</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// =============================================================================
// Notification Settings Panel
// =============================================================================
const NotificationSettings = () => {
  const [settings, setSettings]     = useState(null);
  const [saving, setSaving]         = useState(false);
  const [testing, setTesting]       = useState(null);
  const [ntfyForm]                  = Form.useForm();
  const [emailForm]                 = Form.useForm();
  const message = useMessage();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await adminService.getNotificationSettings();
        if (!cancelled) {
          setSettings(data.settings);
          ntfyForm.setFieldsValue(data.settings.ntfy || {});
          emailForm.setFieldsValue(data.settings.email || {});
        }
      } catch {
        // silent
      }
    };
    load();
    return () => { cancelled = true; };
  }, [ntfyForm, emailForm]);

  const handleSaveNtfy = async () => {
    setSaving(true);
    try {
      const values = await ntfyForm.validateFields();
      await adminService.updateNotificationSettings({ ntfy: values });
      setSettings(prev => ({ ...prev, ntfy: values }));
      message.success('Ntfy settings saved');
    } catch {
      message.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      const values = await emailForm.validateFields();
      await adminService.updateNotificationSettings({ email: values });
      setSettings(prev => ({ ...prev, email: values }));
      message.success('Email settings saved');
    } catch {
      message.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (channel) => {
    setTesting(channel);
    try {
      await adminService.testNotification(channel);
      message.success(`Test ${channel} notification sent`);
    } catch {
      message.error(`Test failed — check your ${channel} settings`);
    } finally {
      setTesting(null);
    }
  };

  if (!settings) return <Spin size="small" />;

  return (
    <Collapse
      ghost
      style={{ background: 'transparent' }}
      items={[
        {
          key: 'ntfy',
          label: (
            <Space>
              <BellOutlined style={{ color: brandColors.gold }} />
              <Text style={{ color: '#fff', fontWeight: 600 }}>Ntfy Notifications</Text>
              <Tag color={settings.ntfy?.enabled ? 'success' : 'default'}>
                {settings.ntfy?.enabled ? 'Enabled' : 'Disabled'}
              </Tag>
            </Space>
          ),
          children: (
            <Form form={ntfyForm} layout="vertical" requiredMark={false}>
              <Form.Item name="enabled" valuePropName="checked">
                <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
              </Form.Item>
              <Form.Item name="url" label="Ntfy URL">
                <Input placeholder="https://ntfy.schoepels.com" />
              </Form.Item>
              <Form.Item name="topic" label="Topic">
                <Input placeholder="ptraker-alerts" />
              </Form.Item>
              <Form.Item name="token" label="Token (optional)">
                <Input.Password placeholder="Bearer token if required" />
              </Form.Item>
              <Space>
                <Button type="primary" onClick={handleSaveNtfy} loading={saving} style={{ fontWeight: 600 }}>
                  Save
                </Button>
                <Button
                  icon={<SendOutlined />}
                  onClick={() => handleTest('ntfy')}
                  loading={testing === 'ntfy'}
                >
                  Send test
                </Button>
              </Space>
            </Form>
          ),
        },
        {
          key: 'email',
          label: (
            <Space>
              <MailOutlined style={{ color: brandColors.gold }} />
              <Text style={{ color: '#fff', fontWeight: 600 }}>Email Notifications</Text>
              <Tag color={settings.email?.enabled ? 'success' : 'default'}>
                {settings.email?.enabled ? 'Enabled' : 'Disabled'}
              </Tag>
            </Space>
          ),
          children: (
            <Form form={emailForm} layout="vertical" requiredMark={false}>
              <Form.Item name="enabled" valuePropName="checked">
                <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
              </Form.Item>
              <Form.Item
                name="recipient"
                label="Recipient Email"
                extra={
                  <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
                    Where admin alert emails are sent. Uses your existing SMTP configuration.
                  </Text>
                }
              >
                <Input placeholder="dave@theschoepels.com" />
              </Form.Item>
              <Space>
                <Button type="primary" onClick={handleSaveEmail} loading={saving} style={{ fontWeight: 600 }}>
                  Save
                </Button>
                <Button
                  icon={<SendOutlined />}
                  onClick={() => handleTest('email')}
                  loading={testing === 'email'}
                >
                  Send test
                </Button>
              </Space>
            </Form>
          ),
        },
      ]}
    />
  );
};

// =============================================================================
// Admin Page
// =============================================================================
const Admin = () => {
  const [users, setUsers]               = useState([]);
  const [requests, setRequests]         = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [inviteOpen, setInviteOpen]     = useState(false);
  const [inviting, setInviting]         = useState(false);
  const [refreshKey, setRefreshKey]     = useState(0);
  const message = useMessage();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [usersData, requestsData] = await Promise.all([
          adminService.getUsers(),
          adminService.getRoleRequests(),
        ]);
        if (!cancelled) {
          setUsers(usersData.users);
          setPendingCount(usersData.pendingRequests);
          setRequests(requestsData.requests);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleInvite = async (email, role) => {
    setInviting(true);
    try {
      await adminService.inviteUser(email, role);
      message.success(`Invitation sent to ${email}`);
      setInviteOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await adminService.updateUserRole(userId, role);
      message.success(`Role updated to ${role}`);
      setRefreshKey(k => k + 1);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleReview = async (requestId, action) => {
    try {
      await adminService.reviewRoleRequest(requestId, action);
      message.success(action === 'approve' ? 'Request approved' : 'Request denied');
      setRefreshKey(k => k + 1);
    } catch {
      message.error('Failed to process request');
    }
  };

  const handleDeleteUser = async (userId) => {
  try {
    await adminService.deleteUser(userId);
    message.success('User deleted');
    setRefreshKey(k => k + 1);
  } catch (err) {
    message.error(err.response?.data?.message || 'Failed to delete user');
  }
};

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: '#fff', fontWeight: 600 }}>
            {record.display_name || 'No name set'}
          </Text>
          <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>{record.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (val) => <RoleBadge role={val} />,
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val) => (
        <Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>
          {formatDateTime(val)}
        </Text>
      ),
    },
    {
      title: 'Change Role',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Select
          value={record.role}
          size="small"
          style={{ width: 160 }}
          onChange={(role) => handleRoleChange(record.id, role)}
        >
          <Option value="admin">Admin</Option>
          <Option value="user">User</Option>
          <Option value="viewer">Viewer</Option>
        </Select>
      ),
    },
    {
  title: '',
  key: 'delete',
  width: 60,
  render: (_, record) => (
    <Popconfirm
      title={`Delete ${record.display_name || record.email}?`}
      description="This permanently deletes their account and all their data."
      onConfirm={() => handleDeleteUser(record.id)}
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

  const requestColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: '#fff', fontWeight: 600 }}>{record.display_name}</Text>
          <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>{record.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Current Role',
      key: 'current_role',
      width: 100,
      render: (_, record) => <RoleBadge role={record.current_role} />,
    },
    {
      title: 'Requesting',
      key: 'requested_role',
      width: 100,
      render: (_, record) => <RoleBadge role={record.requested_role} />,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (val) => (
        <Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>{val || '—'}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (val) => {
        const colors = { pending: 'warning', approved: 'success', denied: 'error' };
        return <Tag color={colors[val]}>{val}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => record.status !== 'pending' ? null : (
        <Space size={8}>
          <Tooltip title="Approve">
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleReview(record.id, 'approve')}
              style={{ fontWeight: 600 }}
            >
              Approve
            </Button>
          </Tooltip>
          <Tooltip title="Deny">
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleReview(record.id, 'deny')}
            >
              Deny
            </Button>
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
      <Title level={4} style={{ color: '#fff', marginBottom: 24, marginTop: 0 }}>
        Admin
      </Title>

      {/* Users */}
      <Card
        style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}
        title={
          <Space>
            <TeamOutlined style={{ color: brandColors.gold }} />
            <Text style={{ color: '#fff', fontWeight: 600 }}>Users</Text>
            <Text style={{ color: brandColors.textMuted, fontSize: 13 }}>
              ({users.length})
            </Text>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setInviteOpen(true)}
            style={{ fontWeight: 600 }}
          >
            Invite User
          </Button>
        }
      >
        <Table
          dataSource={users}
          columns={userColumns}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Card>

      {/* Role Requests */}
      <Card
        style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}
        title={
          <Space>
            <Badge count={pendingCount} size="small">
              <CrownOutlined style={{ color: brandColors.gold }} />
            </Badge>
            <Text style={{ color: '#fff', fontWeight: 600 }}>Role Upgrade Requests</Text>
          </Space>
        }
      >
        {requests.length === 0 ? (
          <Text style={{ color: brandColors.textMuted }}>No role requests</Text>
        ) : (
          <Table
            dataSource={requests}
            columns={requestColumns}
            rowKey="id"
            size="small"
            pagination={false}
          />
        )}
      </Card>

      {/* Notification Settings */}
      <Card
        style={{ borderColor: brandColors.darkBorder }}
        title={
          <Space>
            <BellOutlined style={{ color: brandColors.gold }} />
            <Text style={{ color: '#fff', fontWeight: 600 }}>Notification Settings</Text>
          </Space>
        }
      >
        <NotificationSettings />
      </Card>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
        loading={inviting}
      />
    </div>
  );
};

export default Admin;
