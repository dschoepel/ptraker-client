import { Typography } from 'antd';
import { brandColors } from '../theme';

const { Title, Text } = Typography;

// Temporary placeholder — will be built out next
const Import = () => (
  <div>
    <Title level={4} style={{ color: '#fff', marginBottom: 8, marginTop: 0 }}>
      Import Positions
    </Title>
    <Text style={{ color: brandColors.textSecondary }}>
      Import wizard coming soon.
    </Text>
  </div>
);

export default Import;
