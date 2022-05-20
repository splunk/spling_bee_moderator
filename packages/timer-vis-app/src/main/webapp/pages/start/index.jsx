import React from 'react';
import layout from '@splunk/react-page';

import { SplunkThemeProvider } from '@splunk/themes';

import Heading from '@splunk/react-ui/Heading';
import TimerVis from '@splunk/timer-vis';
const themeToVariant = {
    enterprise: { colorScheme: 'light', family: 'enterprise' },
    enterpriseDark: { colorScheme: 'dark', family: 'enterprise' },
    prisma: { colorScheme: 'dark', family: 'prisma' },
};

// use DashboardCore to render a simple dashboard
layout(
    <SplunkThemeProvider {...themeToVariant.enterpriseDark}>
        <TimerVis></TimerVis>
    </SplunkThemeProvider>,
    {
        pageTitle: 'Countdown Timer App',
        hideFooter: true,
        layout: 'fixed',
    }
);
