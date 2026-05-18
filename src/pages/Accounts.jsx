import { Typography } from 'antd';
import { brandColors } from '../theme';

const { Title, Text } = Typography;

// Temporary placeholder — will be built out next
const Accounts = () => (
  <div>
    <Title level={4} style={{ color: '#fff', marginBottom: 8, marginTop: 0 }}>
      Accounts
    </Title>
    <Text style={{ color: brandColors.textSecondary }}>
      Account management coming soon.
    </Text>
  </div>
);

export default Accounts;
