import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Alert, Result } from 'antd';
import useMessage from '../hooks/useMessage';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { brandColors } from '../theme';
import { supabaseAuth } from '../services/auth.service';

const { Title, Text, Link } = Typography;

// =============================================================================
// Reset Password Page
// =============================================================================
// Two entry paths:
//   1. OTP code    — session already in localStorage from verifyOtp in Login.jsx
//   2. Email link  — Supabase fires PASSWORD_RECOVERY auth event
// =============================================================================

const ResetPassword = () => {
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(false);
  const [tokenReady, setTokenReady] = useState(false);
  const navigate                    = useNavigate();
  const [form]                      = Form.useForm();
  const message = useMessage();

  useEffect(() => {
    let subscription = null;
    let timeoutId    = null;

    const establish = async () => {
      // Path 1: OTP flow — token already in localStorage from verifyOtp
      const storedToken   = localStorage.getItem('ptraker_token');
      const storedRefresh = localStorage.getItem('ptraker_refresh_token');

      if (storedToken) {
        const { data, error: sessionError } = await supabaseAuth.auth.setSession({
          access_token:  storedToken,
          refresh_token: storedRefresh || storedToken,
        });

        if (!sessionError && data?.user) {
          setTokenReady(true);
          return;
        }
      }

      // Path 2: Email link — listen for PASSWORD_RECOVERY event
      const { data } = supabaseAuth.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setTokenReady(true);
          clearTimeout(timeoutId);
        }
      });
      subscription = data.subscription;

      // Timeout — 4 seconds then show error
      timeoutId = setTimeout(() => {
        setTokenReady(prev => {
          if (!prev) setError('Invalid or expired reset link. Please request a new one.');
          return prev;
        });
      }, 4000);
    };

    establish();

    return () => {
      if (subscription) subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabaseAuth.auth.updateUser({
        password: values.password,
      });

      if (updateError) throw updateError;

      // Clear stored tokens — user will log in fresh
      localStorage.removeItem('ptraker_token');
      localStorage.removeItem('ptraker_user');
      localStorage.removeItem('ptraker_refresh_token');

      setSuccess(true);
      message.success('Password updated successfully');
      setTimeout(() => navigate('/login'), 2500);

    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: brandColors.darkBg, padding: 24,
      }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: brandColors.gold }} />}
          title={<span style={{ color: '#fff' }}>Password updated</span>}
          subTitle={
            <span style={{ color: brandColors.textSecondary }}>
              Your password has been changed. Redirecting to sign in...
            </span>
          }
          extra={
            <Button type="primary" onClick={() => navigate('/login')}>
              Sign In Now
            </Button>
          }
          style={{ background: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: brandColors.darkBg, padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: brandColors.darkCard,
            border: `2px solid ${brandColors.darkBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 22, fontWeight: 700,
          }}>
            <span style={{ color: '#fff' }}>p</span>
            <span style={{ color: brandColors.gold }}>T</span>
          </div>
          <Title level={2} style={{ color: '#fff', margin: 0, fontSize: 24 }}>
            portfolio<span style={{ color: brandColors.gold }}>Traker</span>
          </Title>
        </div>

        {/* Card */}
        <div style={{
          background: brandColors.darkCard,
          border: `1px solid ${brandColors.darkBorder}`,
          borderRadius: 12, padding: 32,
        }}>
          <Title level={4} style={{ color: '#fff', marginBottom: 8, marginTop: 0 }}>
            Set new password
          </Title>
          <Text style={{
            color: brandColors.textSecondary, fontSize: 13,
            display: 'block', marginBottom: 24,
          }}>
            Choose a strong password for your account.
          </Text>

          {error && (
            <Alert
              type="error"
              message={error}
              style={{ marginBottom: 20 }}
              action={
                <Button size="small" type="link" onClick={() => navigate('/login')}>
                  Request new link
                </Button>
              }
            />
          )}

          {!tokenReady && !error && (
            <Text style={{ color: brandColors.textSecondary }}>
              Verifying reset link...
            </Text>
          )}

          {tokenReady && (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
            >
              <Form.Item
                name="password"
                label={<span style={{ color: brandColors.textSecondary }}>New Password</span>}
                rules={[
                  { required: true, message: 'Password is required' },
                  { min: 8, message: 'At least 8 characters' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: brandColors.textMuted }} />}
                  placeholder="At least 8 characters"
                  size="large"
                  autoComplete="new-password"
                  autoFocus
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={<span style={{ color: brandColors.textSecondary }}>Confirm Password</span>}
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
                style={{ marginBottom: 24 }}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: brandColors.textMuted }} />}
                  placeholder="Repeat your new password"
                  size="large"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  block
                  style={{ fontWeight: 600, height: 44 }}
                >
                  Update Password
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>

        <Text style={{
          display: 'block', textAlign: 'center', marginTop: 16,
          color: brandColors.textMuted, fontSize: 12,
        }}>
          <Link onClick={() => navigate('/login')} style={{ color: brandColors.textMuted }}>
            ← Back to sign in
          </Link>
        </Text>
      </div>
    </div>
  );
};

export default ResetPassword;
