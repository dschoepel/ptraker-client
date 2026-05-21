import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Alert, Result } from 'antd';
import useMessage from '../hooks/useMessage';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { brandColors } from '../theme';
import { supabaseAuth } from '../services/auth.service';


const { Title, Text } = Typography;

// =============================================================================
// Set Password Page
// =============================================================================
// Handles new user password setup after accepting an invite.
//
// Flow:
//   1. New user clicks invite link in email
//   2. Supabase verifies invite token → redirects to /dashboard with hash tokens
//   3. AuthContext detects type=invite in hash → redirects here
//   4. User sets their password
//   5. Redirect to dashboard
// =============================================================================

const SetPassword = () => {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);
  const [ready, setReady]       = useState(false);
  const navigate                = useNavigate();
  const [form]                  = Form.useForm();
  const message = useMessage();
  

  useEffect(() => {
  const establish = async () => {
    const token = localStorage.getItem('ptraker_token');
    const refreshToken = localStorage.getItem('ptraker_refresh_token');

    if (!token) {
      setError('Your invite link has expired or is invalid. Please ask an admin to send a new invite.');
      setReady(true);
      return;
    }

    const { data, error: sessionError } = await supabaseAuth.auth.setSession({
      access_token: token,
      refresh_token: refreshToken || token,
    });

    if (sessionError || !data?.user) {
      setError('Your invite link has expired or is invalid. Please ask an admin to send a new invite.');
    }
    setReady(true);
  };

  establish();
}, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabaseAuth.auth.updateUser({
        password: values.password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      message.success('Password set successfully — welcome to portfolioTraker!');

      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err) {
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: brandColors.darkBg,
        padding: 24,
      }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: brandColors.gold }} />}
          title={<span style={{ color: '#fff' }}>Welcome to portfolioTraker!</span>}
          subTitle={
            <span style={{ color: brandColors.textSecondary }}>
              Your account is ready. Taking you to the dashboard...
            </span>
          }
          extra={
            <Button type="primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          }
          style={{ background: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: brandColors.darkBg,
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: brandColors.darkCard,
            border: `2px solid ${brandColors.darkBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 22,
            fontWeight: 700,
          }}>
            <span style={{ color: '#fff' }}>p</span>
            <span style={{ color: brandColors.gold }}>T</span>
          </div>
          <Title level={2} style={{ color: '#fff', margin: 0, fontSize: 24 }}>
            portfolio<span style={{ color: brandColors.gold }}>Traker</span>
          </Title>
          <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>
            Welcome! Set your password to get started.
          </Text>
        </div>

        {/* Card */}
        <div style={{
          background: brandColors.darkCard,
          border: `1px solid ${brandColors.darkBorder}`,
          borderRadius: 12,
          padding: 32,
        }}>
          <Title level={4} style={{ color: '#fff', marginBottom: 8, marginTop: 0 }}>
            Set your password
          </Title>
          <Text style={{
            color: brandColors.textSecondary,
            fontSize: 13,
            display: 'block',
            marginBottom: 24,
          }}>
            Choose a strong password for your new account.
          </Text>

          {error && (
            <Alert
              type="error"
              message={error}
              style={{ marginBottom: 20 }}
              action={
                <Button size="small" type="link" onClick={() => navigate('/login')}>
                  Back to login
                </Button>
              }
            />
          )}

          {!ready && !error && (
            <Text style={{ color: brandColors.textSecondary }}>
              Verifying your invitation...
            </Text>
          )}

          {ready && !error && (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
            >
              <Form.Item
                name="password"
                label={<span style={{ color: brandColors.textSecondary }}>Password</span>}
                rules={[
                  { required: true, message: 'Password is required' },
                  { min: 8, message: 'Password must be at least 8 characters' },
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
                  placeholder="Repeat your password"
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
                  Set Password & Continue
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
