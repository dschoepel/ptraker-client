import { useState } from "react";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Typography,
  Grid,
} from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  BankOutlined,
  UploadOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useAuth } from "../store/useAuth";
import { SettingOutlined, SafetyOutlined } from "@ant-design/icons";

// import { App as AntdApp } from 'antd';
import { brandColors } from "../theme";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

// =============================================================================
// Logo — defined OUTSIDE AppLayout so it is not recreated on every render
// =============================================================================
const Logo = ({ collapsed, onClick }) => (
  <div
    style={{
      height: 64,
      display: "flex",
      alignItems: "center",
      padding: collapsed ? "0 20px" : "0 24px",
      borderBottom: `1px solid ${brandColors.darkBorder}`,
      overflow: "hidden",
      cursor: "pointer",
    }}
    onClick={onClick}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: brandColors.darkHover,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "-0.5px",
      }}
    >
      <span style={{ color: "#fff" }}>p</span>
      <span style={{ color: brandColors.gold }}>T</span>
    </div>

    {!collapsed && (
      <span
        style={{
          marginLeft: 12,
          fontSize: 16,
          fontWeight: 600,
          whiteSpace: "nowrap",
          color: "#fff",
        }}
      >
        portfolio<span style={{ color: brandColors.gold }}>Traker</span>
      </span>
    )}
  </div>
);

// =============================================================================
// AppLayout — main shell with responsive sidebar/bottom nav
// =============================================================================
const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  

  const isAdmin =
    user?.role === "admin" || user?.user_metadata?.role === "admin";
  const isViewer =
    user?.role === "viewer" || user?.user_metadata?.role === "viewer";

  // =============================================================================
  // Nav items
  // =============================================================================
  const navItems = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    ...(!isViewer
      ? [
          { key: "/accounts", icon: <BankOutlined />, label: "Accounts" },
          { key: "/import", icon: <UploadOutlined />, label: "Import" },
        ]
      : []),
    { key: "/watchlist", icon: <StarOutlined />, label: "Watchlist" },
    { key: "/profile", icon: <SettingOutlined />, label: "Settings" },
    ...(isAdmin
      ? [{ key: "/admin", icon: <SafetyOutlined />, label: "Admin" }]
      : []),
  ];

  const isMobile = !screens.md;

  const handleMenuClick = ({ key }) => navigate(key);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userMenuItems = [
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: 'Profile & Settings',
    onClick: () => navigate('/profile'),
  },
  { type: 'divider' },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: 'Sign out',
    danger: true,
    onClick: handleLogout,
  },
];

  // ============================================================
  // Mobile layout — fixed header + bottom tab bar
  // ============================================================
  if (isMobile) {
    return (
      <Layout style={{ minHeight: "100vh", background: brandColors.darkBg }}>
        <Header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            height: 56,
            background: brandColors.darkCard,
            borderBottom: `1px solid ${brandColors.darkBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: brandColors.darkHover,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <span style={{ color: "#fff" }}>p</span>
              <span style={{ color: brandColors.gold }}>T</span>
            </div>
            <Text style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>
              portfolio<span style={{ color: brandColors.gold }}>Traker</span>
            </Text>
          </div>

          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Avatar
                size={32}
                icon={<UserOutlined />}
                style={{ background: brandColors.gold, color: "#000" }}
              />
              <Text
                style={{ color: brandColors.textSecondary, fontSize: 13 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/profile");
                }}
              >
                {user?.displayName || user?.email}
              </Text>
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            marginTop: 56,
            marginBottom: 60,
            padding: 16,
            minHeight: "calc(100vh - 116px)",
          }}
        >
          <Outlet />
        </Content>

        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            background: brandColors.darkCard,
            borderTop: `1px solid ${brandColors.darkBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            zIndex: 100,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.key;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 0",
                  color: isActive
                    ? brandColors.gold
                    : brandColors.textSecondary,
                  transition: "color 0.2s",
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span
                  style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </Layout>
    );
  }

  // ============================================================
  // Desktop layout — collapsible sidebar
  // ============================================================
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          borderRight: `1px solid ${brandColors.darkBorder}`,
        }}
      >
        <Logo collapsed={collapsed} onClick={() => navigate("/dashboard")} />

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={navItems}
          onClick={handleMenuClick}
          style={{ marginTop: 8, border: "none" }}
        />
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 220,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 101,
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${brandColors.darkBorder}`,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: brandColors.textSecondary, fontSize: 16 }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  style={{ background: brandColors.gold, color: "#000" }}
                />
                <Text
                  style={{ color: brandColors.textSecondary, fontSize: 13 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/profile");
                  }}
                >
                  {user?.displayName || user?.email}
                </Text>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ padding: 24, minHeight: "calc(100vh - 64px)" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
