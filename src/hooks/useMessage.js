import { App as AntdApp } from 'antd';

// Drop-in for AntdApp.useApp().message — uses notification API for proper close button support.
// Usage: const message = useMessage();
const useMessage = () => {
  const { notification } = AntdApp.useApp();
  const wrap = (type) => (content) => notification[type]({ title: content, duration: 8, placement: 'topRight' });
  return {
    success: wrap('success'),
    error:   wrap('error'),
    warning: wrap('warning'),
    info:    wrap('info'),
  };
};

export default useMessage;
