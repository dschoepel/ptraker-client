import { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Space,
  App as AntdApp,
  Divider,
  Tag,
  Alert,
  Modal,
  Table,
  Popconfirm,
} from "antd";
import {
  UserOutlined,
  ShareAltOutlined,
  CrownOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useAuth } from "../store/useAuth";
import { sharesService, userService } from "../services/admin.service";
import { brandColors } from "../theme";
import { formatDateTime } from "../utils/formatters";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const { Title, Text } = Typography;

// =============================================================================
// Profile / Settings Page
// =============================================================================

const RoleBadge = ({ role }) => {
  const config = {
    admin: { color: "gold", icon: <CrownOutlined />, label: "Admin" },
    user: { color: "blue", icon: <UserOutlined />, label: "User" },
    viewer: { color: "default", icon: <EyeOutlined />, label: "Viewer" },
  };
  const { color, icon, label } = config[role] || config.user;
  return (
    <Tag color={color} icon={icon}>
      {label}
    </Tag>
  );
};

// =============================================================================
// Portfolio Sharing Section
// =============================================================================
const SharingSection = () => {
  const [shares, setShares] = useState({ owned: [], viewing: [] });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [sharing, setSharing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { message } = AntdApp.useApp();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await sharesService.getShares();
        if (!cancelled) setShares(data);
      } catch {
        // silent
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleShare = async () => {
    try {
      const values = await form.validateFields();
      setSharing(true);
      await sharesService.createShare(values.viewerEmail, values.label);
      message.success(`Portfolio shared with ${values.viewerEmail}`);
      form.resetFields();
      setShareModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to share portfolio");
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveShare = async (id) => {
    try {
      await sharesService.deleteShare(id);
      message.success("Share removed");
      setRefreshKey((k) => k + 1);
    } catch {
      message.error("Failed to remove share");
    }
  };

  const sharedWithColumns = [
    {
      title: "Shared With",
      dataIndex: "viewer_name",
      key: "viewer_name",
      render: (val) => <Text style={{ color: "#fff" }}>{val}</Text>,
    },
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
      render: (val) => (
        <Text style={{ color: brandColors.textSecondary }}>{val || "—"}</Text>
      ),
    },
    {
      title: "Since",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (val) => (
        <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
          {formatDateTime(val)}
        </Text>
      ),
    },
    {
      title: "",
      key: "actions",
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
          <Text style={{ color: "#fff", fontWeight: 600 }}>
            Portfolio Sharing
          </Text>
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
      <Text
        style={{
          color: brandColors.textSecondary,
          display: "block",
          marginBottom: 16,
        }}
      >
        Share view-only access to your portfolio with other ptraker users.
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
          <Text
            style={{
              color: brandColors.textSecondary,
              fontWeight: 600,
              display: "block",
              marginBottom: 12,
            }}
          >
            Portfolios shared with you
          </Text>
          {shares.viewing.map((s) => (
            <Tag key={s.id} color="blue" style={{ marginBottom: 8 }}>
              {s.owner_name}'s portfolio
            </Tag>
          ))}
        </>
      )}

      <Modal
        title={
          <Text style={{ color: "#fff", fontWeight: 600 }}>
            Share My Portfolio
          </Text>
        }
        open={shareModalOpen}
        onCancel={() => {
          setShareModalOpen(false);
          form.resetFields();
        }}
        onOk={handleShare}
        confirmLoading={sharing}
        okText="Share"
        okButtonProps={{ style: { fontWeight: 600 } }}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="viewerEmail"
            label="User's Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
            extra={
              <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
                They must already have a ptraker account.
              </Text>
            }
          >
            <Input placeholder="april@example.com" size="large" autoFocus />
          </Form.Item>
          <Form.Item name="label" label="Label (optional)">
            <Input placeholder="e.g. April viewing Dave's portfolio" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

// =============================================================================
// Upgrade Request Section (viewers only)
// =============================================================================
const UpgradeSection = () => {
  const [request, setRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();

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
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const data = await userService.requestUpgrade(values.message);
      message.success(data.message);
      setModalOpen(false);
      setRequest({ status: "pending", created_at: new Date().toISOString() });
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Text style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>
          Request Full Access
        </Text>
        <Text style={{ color: brandColors.textSecondary }}>
          You currently have view-only access. Request an upgrade to a full user
          account to import your own portfolio data.
        </Text>

        {request?.status === "pending" && (
          <Alert
            type="info"
            message="Upgrade request pending"
            description={`Submitted ${formatDateTime(request.created_at)}. An admin will review your request.`}
          />
        )}
        {request?.status === "approved" && (
          <Alert type="success" message="Your upgrade request was approved!" />
        )}
        {request?.status === "denied" && (
          <Alert
            type="error"
            message="Your upgrade request was denied. Contact an admin for more information."
          />
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
        title={
          <Text style={{ color: "#fff", fontWeight: 600 }}>
            Request Full Access
          </Text>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
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
// Profile Page
// =============================================================================
const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        displayName: user.displayName || user.display_name || "",
      });
    }
  }, [user, form]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      updateUser({ ...user, displayName: values.displayName });
      message.success("Profile updated");
    } catch {
      message.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOwnAccount = async () => {
    try {
      await api.delete("/user/account");
      logout();
      navigate("/login");
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  const isViewer =
    user?.role === "viewer" || user?.user_metadata?.role === "viewer";

  return (
    <div>
      <Title
        level={4}
        style={{ color: "#fff", marginBottom: 24, marginTop: 0 }}
      >
        Profile &amp; Settings
      </Title>

      {/* Profile info */}
      <Card
        style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}
        title={
          <Space>
            <UserOutlined style={{ color: brandColors.gold }} />
            <Text style={{ color: "#fff", fontWeight: 600 }}>Your Profile</Text>
          </Space>
        }
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Space>
            <Text style={{ color: brandColors.textSecondary }}>Email:</Text>
            <Text style={{ color: "#fff" }}>{user?.email}</Text>
          </Space>
          <Space>
            <Text style={{ color: brandColors.textSecondary }}>Role:</Text>
            <RoleBadge
              role={user?.role || user?.user_metadata?.role || "user"}
            />
          </Space>

          <Divider
            style={{ borderColor: brandColors.darkBorder, margin: "8px 0" }}
          />

          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            style={{ maxWidth: 400 }}
          >
            <Form.Item
              name="displayName"
              label="Display Name"
              rules={[{ required: true, message: "Display name is required" }]}
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

      {/* Portfolio sharing */}
      <SharingSection />
      {/* Danger Zone */}
      <Card
        style={{ borderColor: brandColors.loss, marginBottom: 24 }}
        title={
          <Text style={{ color: brandColors.loss, fontWeight: 600 }}>
            Danger Zone
          </Text>
        }
      >
        <Space direction="vertical" size={8}>
          <Text style={{ color: brandColors.textSecondary }}>
            Permanently delete your account and all your portfolio data. This
            cannot be undone.
          </Text>
          <Popconfirm
            title="Delete your account?"
            description="This permanently deletes your account, all accounts, positions, and import history. This cannot be undone."
            onConfirm={handleDeleteOwnAccount}
            okText="Yes, delete everything"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              style={{ fontWeight: 600 }}
            >
              Delete My Account
            </Button>
          </Popconfirm>
        </Space>
      </Card>
    </div>
  );
};

export default Profile;
