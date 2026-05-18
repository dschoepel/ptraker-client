import { useState } from "react";
import { Form, Input, Button, Typography, Alert, App as AntdApp } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/useAuth";
import { brandColors } from "../theme";
import { authService } from '../services/auth.service';

const { Title, Text, Link } = Typography;

// =============================================================================
// Login Page
// =============================================================================

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forgotMode, setForgotMode] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();

  
  const handleSubmit = async (values) => {
  setLoading(true);
  setError(null);
  try {
    if (forgotMode) {
      await authService.forgotPassword(values.email);
      setError(null);
      // Show success message
      message.success('Reset link sent — check your email');
      setForgotMode(false);
    } else {
      await login(values.email, values.password);
      navigate('/dashboard');
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: brandColors.darkBg,
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: brandColors.darkCard,
              border: `2px solid ${brandColors.darkBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#fff" }}>p</span>
            <span style={{ color: brandColors.gold }}>T</span>
          </div>
          <Title level={2} style={{ color: "#fff", margin: 0, fontSize: 24 }}>
            portfolio<span style={{ color: brandColors.gold }}>Traker</span>
          </Title>
          <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>
            Your consolidated portfolio dashboard
          </Text>
        </div>

        {/* Login card */}
        <div
          style={{
            background: brandColors.darkCard,
            border: `1px solid ${brandColors.darkBorder}`,
            borderRadius: 12,
            padding: 32,
          }}
        >
          <Title
            level={4}
            style={{ color: "#fff", marginBottom: 24, marginTop: 0 }}
          >
            {forgotMode ? "Reset Password" : "Sign In"}
          </Title>

          {error && (
            <Alert
              type="error"
              message={error}
              style={{ marginBottom: 20 }}
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label={
                <span style={{ color: brandColors.textSecondary }}>Email</span>
              }
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input
                prefix={
                  <UserOutlined style={{ color: brandColors.textMuted }} />
                }
                placeholder="you@example.com"
                size="large"
                autoComplete="email"
              />
            </Form.Item>

            {!forgotMode && (
              <Form.Item
                name="password"
                label={
                  <span style={{ color: brandColors.textSecondary }}>
                    Password
                  </span>
                }
                rules={[{ required: true, message: "Password is required" }]}
                style={{ marginBottom: 8 }}
              >
                <Input.Password
                  prefix={
                    <LockOutlined style={{ color: brandColors.textMuted }} />
                  }
                  placeholder="••••••••"
                  size="large"
                  autoComplete="current-password"
                />
              </Form.Item>
            )}

            <div style={{ textAlign: "right", marginBottom: 20 }}>
              <Link
                onClick={() => setForgotMode(!forgotMode)}
                style={{ fontSize: 13, color: brandColors.textMuted }}
              >
                {forgotMode ? "← Back to sign in" : "Forgot password?"}
              </Link>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                style={{ fontWeight: 600, height: 44 }}
              >
                {forgotMode ? "Send Reset Link" : "Sign In"}
              </Button>
            </Form.Item>
          </Form>
        </div>

        <Text
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 24,
            color: brandColors.textMuted,
            fontSize: 12,
          }}
        >
          portfolioTraker — private family access only
        </Text>
      </div>
    </div>
  );
};

export default Login;
