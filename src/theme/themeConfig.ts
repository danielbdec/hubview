import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
    token: {
        fontSize: 14,
        colorPrimary: '#3b82f6', // blue-500
        colorInfo: '#3b82f6',
        colorSuccess: '#22c55e', // green-500
        colorWarning: '#eab308', // yellow-500
        colorError: '#ef4444', // red-500
        fontFamily: 'var(--font-inter)',
    },
    components: {
        Button: {
            borderRadius: 6,
            controlHeight: 36,
        },
        Input: {
            borderRadius: 6,
            controlHeight: 36,
        },
        Select: {
            borderRadius: 6,
            controlHeight: 36,
        },
        Card: {
            borderRadius: 12,
        },
    },
};

export default theme;
