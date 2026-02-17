import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
    algorithm: require('antd').darkAlgorithm,
    token: {
        fontSize: 14,
        colorPrimary: '#fbbf24', // Gold
        colorBgBase: '#0a192f', // Deep Navy
        colorBgContainer: '#112240', // Surface
        colorText: '#e6f1ff',
        colorTextSecondary: '#8892b0',
        colorBorder: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 8,
        fontFamily: 'var(--font-inter)',
    },
    components: {
        Button: {
            colorPrimary: '#fbbf24',
            algorithm: true, // Enable algorithm for derivative colors
            fontWeight: 600,
        },
        Card: {
            colorBgContainer: 'rgba(17, 34, 64, 0.7)',
            colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
        },
        Modal: {
            contentBg: '#112240',
            headerBg: '#112240',
        },
        Input: {
            colorBgContainer: '#0a192f',
            colorBorder: 'rgba(255, 255, 255, 0.1)',
        }
    },
};

export default theme;
