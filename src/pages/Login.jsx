import { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import useMessage from '../hooks/useMessage';
import { UserOutlined, LockOutlined, NumberOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { authService, supabaseAuth } from '../services/auth.service';
import { brandColors } from '../theme';

const { Title, Text, Link } = Typography;

// =============================================================================
// Login Page
// =============================================================================
// Three modes:
//   'login'   — email + password sign in
//   'forgot'  — enter email to request reset
//   'otp'     — enter 6-digit OTP code from email
// =============================================================================

const Login = () => {
  const [mode, setMode]         = useState('login'); // 'login' | 'forgot' | 'otp'
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [resetEmail, setResetEmail] = useState(''); // remember email for OTP step
  const [successMsg, setSuccessMsg] = useState(null);
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const message = useMessage();
  const [form]                  = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        await login(values.email, values.password);
        navigate('/dashboard');

      } else if (mode === 'forgot') {
        await authService.forgotPassword(values.email);
        setResetEmail(values.email);
        setSuccessMsg('Reset email sent — check your inbox. You can also enter the code below.');
        setMode('otp');
        form.resetFields();

      } else if (mode === 'otp') {
        // Verify OTP token directly with Supabase
        const { data, error: otpError } = await supabaseAuth.auth.verifyOtp({
          email: resetEmail,
          token: values.otp,
          type:  'recovery',
        });

        if (otpError) throw otpError;

        // Session established — store tokens and redirect to set new password
        if (data?.session) {
          localStorage.setItem('ptraker_token', data.session.access_token);
          localStorage.setItem('ptraker_refresh_token', data.session.refresh_token);
        }

        message.success('Code verified — set your new password');
        navigate('/reset-password');
      }

    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setMode('login');
    setError(null);
    setSuccessMsg(null);
    form.resetFields();
  };

  const titles = {
    login:  'Sign In',
    forgot: 'Reset Password',
    otp:    'Enter Reset Code',
  };

  const buttonLabels = {
    login:  'Sign In',
    forgot: 'Send Reset Link',
    otp:    'Verify Code',
  };

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
          <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>
            Your consolidated portfolio dashboard
          </Text>
        </div>

        {/* Card */}
        <div style={{
          background: brandColors.darkCard,
          border: `1px solid ${brandColors.darkBorder}`,
          borderRadius: 12,
          padding: 32,
        }}>
          <Title level={4} style={{ color: '#fff', marginBottom: 24, marginTop: 0 }}>
            {titles[mode]}
          </Title>

          {successMsg && (
            <Alert
              type="success"
              message={successMsg}
              style={{ marginBottom: 20 }}
              closable
              onClose={() => setSuccessMsg(null)}
            />
          )}

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
            {/* Email field — shown on login and forgot */}
            {(mode === 'login' || mode === 'forgot') && (
              <Form.Item
                name="email"
                label={<span style={{ color: brandColors.textSecondary }}>Email</span>}
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: brandColors.textMuted }} />}
                  placeholder="you@example.com"
                  size="large"
                  autoComplete="email"
                  autoFocus
                />
              </Form.Item>
            )}

            {/* Password field — login only */}
            {mode === 'login' && (
              <Form.Item
                name="password"
                label={<span style={{ color: brandColors.textSecondary }}>Password</span>}
                rules={[{ required: true, message: 'Password is required' }]}
                style={{ marginBottom: 8 }}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: brandColors.textMuted }} />}
                  placeholder="••••••••"
                  size="large"
                  autoComplete="current-password"
                />
              </Form.Item>
            )}

            {/* OTP field — otp mode only */}
            {mode === 'otp' && (
              <>
                <Text style={{
                  color: brandColors.textSecondary,
                  fontSize: 13,
                  display: 'block',
                  marginBottom: 16,
                }}>
                  Enter the 6-digit code from the email sent to{' '}
                  <Text style={{ color: '#fff' }}>{resetEmail}</Text>
                </Text>
                <Form.Item
                  name="otp"
                  label={<span style={{ color: brandColors.textSecondary }}>Reset Code</span>}
                  rules={[
                    { required: true, message: 'Code is required' },
                    { len: 6, message: 'Code must be 6 digits' },
                    { pattern: /^\d+$/, message: 'Code must be digits only' },
                  ]}
                >
                  <Input
                    prefix={<NumberOutlined style={{ color: brandColors.textMuted }} />}
                    placeholder="123456"
                    size="large"
                    maxLength={6}
                    autoFocus
                    style={{ letterSpacing: 8, fontSize: 20, textAlign: 'center' }}
                  />
                </Form.Item>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block', marginBottom: 16 }}>
                  Didn't get the email?{' '}
                  <Link onClick={() => setMode('forgot')} style={{ color: brandColors.gold }}>
                    Resend
                  </Link>
                  {' '}or{' '}
                  <Link
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setSuccessMsg(null);
                      form.resetFields();
                    }}
                    style={{ color: brandColors.textMuted }}
                  >
                    use the link in the email instead
                  </Link>
                </Text>
              </>
            )}

            {/* Forgot password link — login mode only */}
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <Link
                  onClick={() => { setMode('forgot'); setError(null); form.resetFields(); }}
                  style={{ fontSize: 13, color: brandColors.textMuted }}
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                style={{ fontWeight: 600, height: 44 }}
              >
                {buttonLabels[mode]}
              </Button>
            </Form.Item>
          </Form>

          {/* Back link — non-login modes */}
          {mode !== 'login' && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link onClick={goBack} style={{ fontSize: 13, color: brandColors.textMuted }}>
                ← Back to sign in
              </Link>
            </div>
          )}
        </div>

        <Text style={{
          display: 'block', textAlign: 'center', marginTop: 24,
          color: brandColors.textMuted, fontSize: 12,
        }}>
          portfolioTraker — private family access only
        </Text>
      </div>
    </div>
  );
};

export default Login;
