import { useState, useEffect, useRef } from 'react';
import {
  Typography, Card, Form, Input, Button, Space,
  Divider, Tag, Alert, Modal, Table, Popconfirm, Switch,
  Select, Radio, Checkbox, Collapse, Spin, Avatar,
} from 'antd';
import {
  UserOutlined, ShareAltOutlined, CrownOutlined,
  DeleteOutlined, PlusOutlined, EyeOutlined, TeamOutlined, DownloadOutlined,
  ImportOutlined, HistoryOutlined, UploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { authService } from '../services/auth.service';
import { sharesService, userService } from '../services/admin.service';
import api from '../services/api';
import { brandColors } from '../theme';
import { formatDateTime } from '../utils/formatters';
import useMessage from '../hooks/useMessage';

const { Title, Text } = Typography;
const { Option } = Select;

// =============================================================================
// Profile / Settings Page
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
// Portfolio Sharing Section
// =============================================================================
const SharingSection = () => {
  const [shares, setShares]                 = useState({ owned: [], viewing: [] });
  const [discoverableUsers, setDiscoverableUsers] = useState([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareMode, setShareMode]           = useState('existing'); // 'existing' | 'new'
  const [form]                              = Form.useForm();
  const [sharing, setSharing]               = useState(false);
  const [refreshKey, setRefreshKey]         = useState(0);
  const message = useMessage();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [sharesData, usersData] = await Promise.all([
          sharesService.getShares(),
          sharesService.getDiscoverableUsers(),
        ]);
        if (!cancelled) {
          setShares(sharesData);
          setDiscoverableUsers(usersData.users || []);
        }
      } catch {
        // silent
      }
    };
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleShare = async () => {
    try {
      const values = await form.validateFields();
      setSharing(true);

      const result = await sharesService.createShare(
        shareMode === 'existing' ? values.viewerId    : null,
        shareMode === 'new'      ? values.viewerEmail : null,
        values.label
      );

      message.success(result.message || 'Portfolio shared');
      form.resetFields();
      setShareModalOpen(false);
      setShareMode('existing');
      setRefreshKey(k => k + 1);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to share portfolio');
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveShare = async (id) => {
    try {
      await sharesService.deleteShare(id);
      message.success('Share removed');
      setRefreshKey(k => k + 1);
    } catch {
      message.error('Failed to remove share');
    }
  };

  const sharedWithColumns = [
    {
      title: 'Shared With',
      dataIndex: 'viewer_name',
      key: 'viewer_name',
      render: (val) => <Text style={{ color: '#fff' }}>{val}</Text>,
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      render: (val) => <Text style={{ color: brandColors.textSecondary }}>{val || '—'}</Text>,
    },
    {
      title: 'Since',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val) => (
        <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>{formatDateTime(val)}</Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Popconfirm
          title="Remove this share?"
          description="This person will no longer be able to view your portfolio."
          onConfirm={() => handleRemoveShare(record.id)}
          okText="Remove"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}
      title={
        <Space>
          <ShareAltOutlined style={{ color: brandColors.gold }} />
          <Text style={{ color: '#fff', fontWeight: 600 }}>Portfolio Sharing</Text>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setShareModalOpen(true)}
          style={{ fontWeight: 600 }}
        >
          Share My Portfolio
        </Button>
      }
    >
      <Text style={{ color: brandColors.textSecondary, display: 'block', marginBottom: 16 }}>
        Share view-only access to your portfolio with other users.
      </Text>

      {shares.owned.length === 0 ? (
        <Text style={{ color: brandColors.textMuted }}>
          You haven't shared your portfolio with anyone yet.
        </Text>
      ) : (
        <Table
          dataSource={shares.owned}
          columns={sharedWithColumns}
          rowKey="id"
          size="small"
          pagination={false}
        />
      )}

      {shares.viewing.length > 0 && (
        <>
          <Divider style={{ borderColor: brandColors.darkBorder }} />
          <Text style={{ color: brandColors.textSecondary, fontWeight: 600, display: 'block', marginBottom: 12 }}>
            Portfolios shared with you
          </Text>
          {shares.viewing.map(s => (
            <Tag key={s.id} color="blue" style={{ marginBottom: 8 }}>
              {s.owner_name}'s portfolio
            </Tag>
          ))}
        </>
      )}

      {/* Share Modal */}
      <Modal
        title={<Text style={{ color: '#fff', fontWeight: 600 }}>Share My Portfolio</Text>}
        open={shareModalOpen}
        onCancel={() => {
          setShareModalOpen(false);
          setShareMode('existing');
          form.resetFields();
        }}
        onOk={handleShare}
        confirmLoading={sharing}
        okText="Share"
        okButtonProps={{ style: { fontWeight: 600 } }}
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>

          {/* Mode selector */}
          <Form.Item label={<span style={{ color: brandColors.textSecondary }}>Share with</span>}>
            <Radio.Group
              value={shareMode}
              onChange={(e) => { setShareMode(e.target.value); form.resetFields(['viewerId', 'viewerEmail']); }}
              buttonStyle="solid"
            >
              <Radio.Button value="existing">
                <TeamOutlined /> Existing user
              </Radio.Button>
              <Radio.Button value="new">
                <PlusOutlined /> Invite someone new
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* Existing user dropdown */}
          {shareMode === 'existing' && (
            <Form.Item
              name="viewerId"
              label={<span style={{ color: brandColors.textSecondary }}>Select User</span>}
              rules={[{ required: true, message: 'Please select a user' }]}
              extra={
                discoverableUsers.length === 0
                  ? <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
                      No discoverable users found. Ask them to enable "Allow others to find me" in their Settings.
                    </Text>
                  : null
              }
            >
              <Select
                placeholder="Search by name..."
                size="large"
                showSearch
                optionFilterProp="label"
                notFoundContent={<Text style={{ color: brandColors.textMuted }}>No users found</Text>}
              >
                {discoverableUsers.map(u => (
                  <Option key={u.id} value={u.id} label={u.display_name}>
                    <Space>
                      <UserOutlined style={{ color: brandColors.textMuted }} />
                      <Text style={{ color: '#fff' }}>{u.display_name}</Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* New user email */}
          {shareMode === 'new' && (
            <Form.Item
              name="viewerEmail"
              label={<span style={{ color: brandColors.textSecondary }}>Email Address</span>}
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email' },
              ]}
              extra={
                <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
                  They will receive an invitation email. Your portfolio will be shared automatically when they accept.
                </Text>
              }
            >
              <Input placeholder="april@example.com" size="large" autoFocus />
            </Form.Item>
          )}

          {/* Optional label */}
          <Form.Item
            name="label"
            label={<span style={{ color: brandColors.textSecondary }}>Label (optional)</span>}
          >
            <Input placeholder="e.g. April viewing Dave's portfolio" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

// =============================================================================
// Privacy Settings Section
// =============================================================================
const PrivacySection = () => {
  const [discoverable, setDiscoverable] = useState(true);
  const [saving, setSaving]             = useState(false);
  const message = useMessage();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authService.getProfile();
        setDiscoverable(data.profile?.discoverable !== false);
      } catch {
        // silent
      }
    };
    load();
  }, []);

  const handleToggle = async (checked) => {
    setSaving(true);
    try {
      await api.patch('/auth/profile', { discoverable: checked });
      setDiscoverable(checked);
      message.success(checked ? 'You are now discoverable' : 'You are now hidden from sharing lists');
    } catch {
      message.error('Failed to update privacy setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}
      title={
        <Space>
          <EyeOutlined style={{ color: brandColors.gold }} />
          <Text style={{ color: '#fff', fontWeight: 600 }}>Privacy</Text>
        </Space>
      }
    >
      <Space orientation="vertical" size={4} style={{ width: '100%' }}>
        <Space>
          <Switch
            checked={discoverable}
            onChange={handleToggle}
            loading={saving}
            checkedChildren="Visible"
            unCheckedChildren="Hidden"
          />
          <Text style={{ color: '#fff' }}>Allow others to find me when sharing portfolios</Text>
        </Space>
        <Text style={{ color: brandColors.textMuted, fontSize: 12, marginLeft: 52 }}>
          When enabled, your display name appears in the sharing dropdown for other users.
          Your email address is never shown.
        </Text>
      </Space>
    </Card>
  );
};

// =============================================================================
// Upgrade Request Section (viewers only)
// =============================================================================
const UpgradeSection = () => {
  const [request, setRequest]       = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form]                      = Form.useForm();
  const message = useMessage();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await userService.getUpgradeRequest();
        if (!cancelled) setRequest(data.request);
      } catch {
        // silent
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const data = await userService.requestUpgrade(values.message);
      message.success(data.message);
      setModalOpen(false);
      setRequest({ status: 'pending', created_at: new Date().toISOString() });
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Text style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
          Request Full Access
        </Text>
        <Text style={{ color: brandColors.textSecondary }}>
          You currently have view-only access. Request an upgrade to a full user account
          to import your own portfolio data.
        </Text>

        {request?.status === 'pending' && (
          <Alert
            type="info"
            message="Upgrade request pending"
            description={`Submitted ${formatDateTime(request.created_at)}. An admin will review your request.`}
          />
        )}
        {request?.status === 'approved' && (
          <Alert type="success" message="Your upgrade request was approved!" />
        )}
        {request?.status === 'denied' && (
          <Alert type="error" message="Your upgrade request was denied. Contact an admin for more information." />
        )}

        {!request && (
          <Button
            type="primary"
            icon={<CrownOutlined />}
            onClick={() => setModalOpen(true)}
            style={{ fontWeight: 600 }}
          >
            Request Upgrade
          </Button>
        )}
      </Space>

      <Modal
        title={<Text style={{ color: '#fff', fontWeight: 600 }}>Request Full Access</Text>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="Submit Request"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="message" label="Message (optional)">
            <Input.TextArea
              placeholder="Tell the admin why you need full access..."
              rows={3}
              maxLength={500}
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

// =============================================================================
// Import Sources Section
// =============================================================================
const ImportSourcesSection = () => {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(null);
  const message = useMessage();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await userService.getImporterPreferences();
        if (!cancelled) setPreferences(data.preferences || []);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleToggle = async (importerId, enabled) => {
    setSaving(importerId);
    try {
      await userService.updateImporterPreferences([{ importer_id: importerId, is_enabled: enabled }]);
      setPreferences(prev => prev.map(p => p.id === importerId ? { ...p, isEnabled: enabled } : p));
    } catch {
      message.error('Failed to save preference');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card
      style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}
      title={
        <Space>
          <ImportOutlined style={{ color: brandColors.gold }} />
          <Text style={{ color: '#fff', fontWeight: 600 }}>Import Sources</Text>
        </Space>
      }
    >
      <Text style={{ color: brandColors.textMuted, fontSize: 13, display: 'block', marginBottom: 16 }}>
        Choose which importers appear on your Import page. OFX / QFX and Manual Entry are always available.
      </Text>
      {loading ? (
        <Spin size="small" />
      ) : preferences.length === 0 ? (
        <Text style={{ color: brandColors.textMuted }}>No optional importers are currently available.</Text>
      ) : (
        <div>
          {preferences.map((imp, i) => (
            <div key={imp.id}>
              {i > 0 && <Divider style={{ borderColor: brandColors.darkBorder, margin: '12px 0' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: '#fff', fontWeight: 600, display: 'block' }}>{imp.name}</Text>
                  <Text style={{ color: brandColors.textSecondary, fontSize: 13, display: 'block' }}>
                    {imp.description}
                  </Text>
                  {imp.instructions && (
                    <Collapse
                      ghost
                      size="small"
                      style={{ background: 'transparent', marginTop: 4 }}
                      items={[{
                        key: 'instructions',
                        label: <Text style={{ color: brandColors.gold, fontSize: 12 }}>How to generate this file</Text>,
                        children: (
                          <Text style={{ color: brandColors.textSecondary, fontSize: 12, whiteSpace: 'pre-line' }}>
                            {imp.instructions}
                          </Text>
                        ),
                      }]}
                    />
                  )}
                </div>
                <Switch
                  checked={imp.isEnabled}
                  loading={saving === imp.id}
                  onChange={(checked) => handleToggle(imp.id, checked)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// =============================================================================
// Import History Retention Section
// =============================================================================
const RETENTION_OPTIONS = [
  { value: 'unlimited', label: 'Unlimited — keep all records' },
  { value: 10,          label: 'Last 10 imports per account' },
  { value: 25,          label: 'Last 25 imports per account' },
  { value: 50,          label: 'Last 50 imports per account' },
  { value: 100,         label: 'Last 100 imports per account' },
];

const ImportHistoryRetentionSection = () => {
  const [limit, setLimit]   = useState(undefined); // undefined = not yet loaded
  const [saving, setSaving] = useState(false);
  const message = useMessage();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await authService.getProfile();
        if (!cancelled) setLimit(data.profile?.importHistoryLimit ?? 'unlimited');
      } catch {
        // silent
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const apiValue = limit === 'unlimited' ? null : limit;
      await api.patch('/auth/profile', { importHistoryLimit: apiValue });
      const purgeResult = await userService.purgeImportHistory();
      const deleted = purgeResult?.deleted ?? 0;
      message.success(
        deleted > 0
          ? `Limit saved. ${deleted} old record${deleted === 1 ? '' : 's'} removed.`
          : 'Limit saved.'
      );
    } catch {
      message.error('Failed to save retention setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}
      title={
        <Space>
          <HistoryOutlined style={{ color: brandColors.gold }} />
          <Text style={{ color: '#fff', fontWeight: 600 }}>Import History Retention</Text>
        </Space>
      }
    >
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>
          Choose how many imports to keep <strong style={{ color: '#fff' }}>per account</strong>. The most recent import for each account is always kept to preserve the Last Import date on your dashboard.
        </Text>
        <Space wrap>
          <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>Keep last:</Text>
          <Select
            value={limit === undefined ? 'unlimited' : limit}
            onChange={setLimit}
            style={{ width: 260 }}
            options={RETENTION_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            loading={limit === undefined}
          />
          <Button type="primary" onClick={handleSave} loading={saving}>
            Save &amp; Apply
          </Button>
        </Space>
        <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
          Older records beyond the limit are removed automatically after each import. The total number of records kept may be slightly higher than the limit when you have multiple accounts.
        </Text>
      </Space>
    </Card>
  );
};

// =============================================================================
// Profile Page
// =============================================================================
const Profile = () => {
  const { user, updateUser, logout }  = useAuth();
  const [form]                        = Form.useForm();
  const [saving, setSaving]           = useState(false);
  const [pendingFile, setPendingFile]   = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const fileInputRef                    = useRef(null);
  const message = useMessage();
  const navigate = useNavigate();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [deleteConfirmed, setDeleteConfirmed] = useState(false);
const [exporting, setExporting]             = useState(false);
const [deleting, setDeleting]               = useState(false);


  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        displayName: user.displayName || user.display_name || '',
      });
    }
  }, [user, form]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await authService.updateProfile({ displayName: values.displayName });
      updateUser({ ...user, displayName: values.displayName });
      message.success('Profile updated');
    } catch {
      message.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const clearPending = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
  };

  const handleSaveAvatar = async () => {
    if (!pendingFile) return;
    setAvatarSaving(true);
    try {
      const { avatarUrl: newUrl } = await authService.uploadAvatar(pendingFile);
      updateUser({ ...user, avatarUrl: newUrl });
      clearPending();
      message.success('Profile photo updated');
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarSaving(true);
    try {
      await authService.removeAvatar();
      updateUser({ ...user, avatarUrl: null });
      message.success('Profile photo removed');
    } catch {
      message.error('Failed to remove photo');
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleDeleteOwnAccount = async () => {
  setDeleting(true);
  try {
    await api.delete('/user/account');
    logout();
    navigate('/login');
  } catch (err) {
    message.error(err.response?.data?.message || 'Failed to delete account');
    setDeleting(false);
  }
};

  const handleExportData = async () => {
  setExporting(true);
  try {
    const response = await api.get('/user/export');
    const blob = new Blob(
      [JSON.stringify(response.data.export, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ptraker-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    message.error('Failed to export data');
  } finally {
    setExporting(false);
  }
};



  const isViewer = user?.role === 'viewer' ||
                   user?.user_metadata?.role === 'viewer';

  return (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: 24, marginTop: 0 }}>
        Profile &amp; Settings
      </Title>

      {/* Profile info */}
      <Card
        style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}
        title={
          <Space>
            <UserOutlined style={{ color: brandColors.gold }} />
            <Text style={{ color: '#fff', fontWeight: 600 }}>Your Profile</Text>
          </Space>
        }
      >
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Space>
            <Text style={{ color: brandColors.textSecondary }}>Email:</Text>
            <Text style={{ color: '#fff' }}>{user?.email}</Text>
          </Space>
          <Space>
            <Text style={{ color: brandColors.textSecondary }}>Role:</Text>
            <RoleBadge role={user?.role || user?.user_metadata?.role || 'user'} />
          </Space>

          <Divider style={{ borderColor: brandColors.darkBorder, margin: '8px 0' }} />

          {/* Profile Photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Avatar
              size={80}
              src={previewUrl || user?.avatarUrl || undefined}
              icon={<UserOutlined />}
              style={{ background: brandColors.gold, color: '#000', flexShrink: 0 }}
            />
            <div>
              <Space size={8} style={{ marginBottom: 6 }}>
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarSaving}
                >
                  {user?.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                </Button>
                {user?.avatarUrl && (
                  <Button size="small" danger onClick={handleRemoveAvatar} loading={avatarSaving}>
                    Remove
                  </Button>
                )}
              </Space>
              {pendingFile && (
                <Space size={8} style={{ display: 'flex', marginBottom: 6 }}>
                  <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>{pendingFile.name}</Text>
                  <Button size="small" type="primary" onClick={handleSaveAvatar} loading={avatarSaving}>
                    Save Photo
                  </Button>
                  <Button size="small" onClick={clearPending} disabled={avatarSaving}>
                    Cancel
                  </Button>
                </Space>
              )}
              <Text style={{ color: brandColors.textMuted, fontSize: 11, display: 'block' }}>
                Max 2 MB · JPEG, PNG, WebP, or GIF
              </Text>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(URL.createObjectURL(f));
                    setPendingFile(f);
                  }
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          <Divider style={{ borderColor: brandColors.darkBorder, margin: '8px 0' }} />

          <Form form={form} layout="vertical" requiredMark={false} style={{ maxWidth: 400 }}>
            <Form.Item
              name="displayName"
              label="Display Name"
              rules={[{ required: true, message: 'Display name is required' }]}
            >
              <Input placeholder="Your name" size="large" />
            </Form.Item>
            <Button
              type="primary"
              onClick={handleSave}
              loading={saving}
              style={{ fontWeight: 600 }}
            >
              Save Changes
            </Button>
          </Form>
        </Space>
      </Card>

      {/* Upgrade request for viewers */}
      {isViewer && <UpgradeSection />}

      {/* Privacy settings */}
      <PrivacySection />

      {/* Import Sources — not available to viewers (they cannot import) */}
      {!isViewer && <ImportSourcesSection />}

      {/* Import History Retention — not available to viewers */}
      {!isViewer && <ImportHistoryRetentionSection />}

      {/* Portfolio sharing — not available to viewers (they have no portfolio to share) */}
      {!isViewer && <SharingSection />}

      {/* Danger Zone */}
<Card
  style={{ borderColor: brandColors.loss, marginBottom: 24 }}
  title={<Text style={{ color: brandColors.loss, fontWeight: 600 }}>Danger Zone</Text>}
>
  <Space orientation="vertical" size={8}>
    <Text style={{ color: brandColors.textSecondary }}>
      Permanently delete your account and all your portfolio data. This cannot be undone.
    </Text>
    <Button
      danger
      icon={<DeleteOutlined />}
      style={{ fontWeight: 600 }}
      onClick={() => setDeleteModalOpen(true)}
    >
      Delete My Account
    </Button>
  </Space>
</Card>

{/* Delete confirmation modal */}
<Modal
  title={<Text style={{ color: brandColors.loss, fontWeight: 600 }}>Delete Account</Text>}
  open={deleteModalOpen}
  onCancel={() => { setDeleteModalOpen(false); setDeleteConfirmed(false); }}
  footer={null}
>
  <Space orientation="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
    <Alert
      type="warning"
      message="This permanently deletes your account and all data. This cannot be undone."
    />

    <Text style={{ color: brandColors.textSecondary }}>
      We recommend downloading your data first in case you change your mind.
    </Text>

    <Button
      icon={<DownloadOutlined />}
      onClick={handleExportData}
      loading={exporting}
      block
    >
      Download My Data
    </Button>

    <Divider style={{ borderColor: brandColors.darkBorder, margin: '4px 0' }} />

    <Checkbox
      checked={deleteConfirmed}
      onChange={e => setDeleteConfirmed(e.target.checked)}
      style={{ color: brandColors.textSecondary }}
    >
      I understand this will permanently delete my account and all my portfolio data
    </Checkbox>

    <Button
      danger
      block
      disabled={!deleteConfirmed}
      loading={deleting}
      onClick={handleDeleteOwnAccount}
      style={{ fontWeight: 600 }}
    >
      Permanently Delete My Account
    </Button>
  </Space>
</Modal>
    </div>
  );
};

export default Profile;
