'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import theme from '@/theme/themeConfig';
import ptBR from 'antd/locale/pt_BR';

const ConfigProviderHelper = ({ children }: { children: React.ReactNode }) => (
    <ConfigProvider theme={theme} locale={ptBR}>
        {children}
    </ConfigProvider>
);

export default ConfigProviderHelper;
