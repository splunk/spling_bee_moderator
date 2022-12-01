import React from 'react';
import layout from '@splunk/react-page';

import { SplunkThemeProvider } from '@splunk/themes';
import { BrowserRouter } from 'react-router-dom';
import TimerVis from '@splunk/timer-vis';

const themeToVariant = {
    enterprise: { colorScheme: 'light', family: 'enterprise' },
    enterpriseDark: { colorScheme: 'dark', family: 'enterprise' },
    prisma: { colorScheme: 'dark', family: 'prisma' },
};

layout(
    <BrowserRouter>
        <SplunkThemeProvider {...themeToVariant.enterpriseDark}>
            <TimerVis></TimerVis>
        </SplunkThemeProvider>
    </BrowserRouter>,
    {
        pageTitle: 'SPLBee Moderator App',
        hideFooter: true,
        layout: 'fixed',
    }
);
