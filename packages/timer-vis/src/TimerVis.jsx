import React, { useCallback, useRef } from 'react';
import EnterprisePreset from '@splunk/dashboard-presets/EnterprisePreset';
import DashboardCore from '@splunk/dashboard-core';
import { DashboardContextProvider } from '@splunk/dashboard-context';
import { useNavigate } from 'react-router-dom';

import CustomTimer from './customTimer';

import Message from '@splunk/react-ui/Message';

import { SplunkThemeProvider } from '@splunk/themes';

var search = window.location.search;
const params = new URLSearchParams(search);

function parseDataUri(dataUri) {
    if (!dataUri.startsWith('data:')) {
        throw new Error('Invalid data URI');
    }
    const semiIdx = dataUri.indexOf(';');
    if (semiIdx < 0) {
        throw new Error('Invalid data URI');
    }
    const mime = dataUri.slice(5, semiIdx);
    if (!dataUri.slice(semiIdx + 1, 7) === 'base64,') {
        throw new Error('Unsupported data URI encoding');
    }
    const data = Buffer.from(dataUri.slice(semiIdx + 8), 'base64');
    return [mime, data];
}

async function getImage(assetType, id) {
    const body = await fetch(
        `/splunkd/__raw/servicesNS/nobody/splunk-dashboard-studio/storage/collections/data/splunk-dashboard-${assetType}/${encodeURIComponent(
            id
        )}`,
        { credentials: 'include' }
    )
        .then((res) => res.json())
        .then((data) => {
            const body = data;
            return body;
        });

    return body;
}

async function downloadImage(src, assetType) {
    if (!src) {
        return src;
    }
    if (src in seenImages) {
        return seenImages[src];
    }
    if (src.startsWith('data:image')) {
        return src;
    }

    if (src.startsWith('<svg ')) {
        return src;
    }
    const [type, id] = src.split('://');
    if (type === 'https' || type === 'http') {
        return src;
    }

    if (type === 'splunk-enterprise-kvstore') {
        var imgData = { dataURI: 'null' };
        try {
            imgData = await getImage(assetType, id).then((blob) => {
                return blob;
            });
        } catch (e) {
            console.log(e);
            console.log('Cannot find image');
        }

        if (imgData.dataURI == 'null') {
            imgData.dataURI == src;
        } else {
            const [mimeType, data] = parseDataUri(imgData.dataURI);
        }
        return imgData.dataURI;
    }
    throw new Error(`Unexpected image type: ${type}`);
}

var seenImages = {};

class TimerVisApp extends React.Component {
    constructor(props) {
        super(props);
        var darktheme = false;
        if (params.get('theme') == 'dark') {
            darktheme = true;
        }
        this.state = {
            isPlaying: false,
            isReversing: false,
            frequency: 24,
            def: props.def,
            playbackMultiplier: '4',
            value: 1,
            dataSources: {},
            width: 100,
            tokenBindings: {},
            tokens: {},
            height: 1000,
            dark: darktheme,
            leftOpen: false,
            openPanelId: 2,
            openInputsPanelId: 2,
            numberOfSearches: 0,
            random: 0,
            navigate: this.props.navigate,
            numberOfSearchesComplete: 0,

            dashboardID: params.get('dashboardid'),
        };
        this.fetchDefinition();

        this.resetInputs = this.resetInputs.bind(this);
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }

    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
    }

    updateWindowDimensions() {
        this.setState({ width: window.innerWidth, height: window.innerHeight });
    }

    fetchDefinition = async () => {
        var search = window.location.search;
        const params = new URLSearchParams(search);
        var dashboardid = params.get('dashboardid');

        const def = await fetch(
            `/splunkd/servicesNS/-/-/data/ui/views/${dashboardid}?output_mode=json`,
            {
                credentials: 'include',
            }
        )
            .then((res) => res.json())
            .then((data) => {
                var xml = new DOMParser().parseFromString(
                    data.entry[0].content['eai:data'],
                    'application/xml'
                );
                var def = JSON.parse(xml.getElementsByTagName('definition')[0].textContent);

                return def;
            })

            .catch((e) => {
                //If there is an error, and demo==true, apply the demo dashboard.

                this.setState({ error_no_dash: true });
                console.error('Error during definition retrieval/parsing', e);
            });
        //Let's process the dashboard before we put it in place
        //First let's get images

        for (const viz of Object.values(def.visualizations || {})) {
            var src = '';
            try {
                if (viz.type === 'viz.singlevalueicon') {
                    viz.options.icon = await downloadImage(viz.options.icon, 'icons');
                }
                if (viz.type === 'splunk.singlevalueicon') {
                    viz.options.icon = await downloadImage(viz.options.icon, 'icons');
                }
                if (viz.type === 'viz.img') {
                    viz.options.src = await downloadImage(viz.options.src, 'images');
                }
                if (viz.type === 'splunk.image') {
                    viz.options.src = await downloadImage(viz.options.src, 'images');
                }
                if (viz.type === 'splunk.choropleth.svg') {
                    viz.options.svg = await downloadImage(viz.options.svg, 'images');
                }
                if (viz.type === 'viz.choropleth.svg') {
                    viz.options.svg = await downloadImage(viz.options.svg, 'images');
                }
            } catch (e) {
                console.log('Failed to load image with src: ' + src);
                console.log(e);
            }
        }

        if (def.layout.options.backgroundImage) {
            try {
                def.layout.options.backgroundImage.src = await downloadImage(
                    def.layout.options.backgroundImage.src,
                    'images'
                );
            } catch (e) {
                console.log(e);
            }
        }

        this.setState({ def });
        this.setState({ defOrig: this.state.def });
        this.setState({ hasNotBeenFetched: false });
    };

    handleRequestOpen(dockPosition) {
        if (dockPosition === 'bottomOpen') {
            setBottomOpen(true);
        } else if (dockPosition === 'leftOpen') {
            this.setState({ leftOpen: true });
        } else if (dockPosition === 'rightOpen') {
            setRightOpen(true);
        } else if (dockPosition === 'topOpen') {
            setTopOpen(true);
        }
    }

    resetInputs() {
        this.setState({ random: Math.random() * 1000000 });
        this.setState({ tokenBindings: { text_token: 'Default Text', dropdown_token: '*' } });
    }

    render() {
        const colStyle = {
            border: `0px solid black`,
            padding: 10,
            paddingRight: 20,
            whiteSpace: 'nowrap',
            textAlign: 'center',
        };

        const customPreset = {
            ...EnterprisePreset,
            visualizations: {
                ...EnterprisePreset.visualizations,
                'splunk.Timer': CustomTimer,
            },
        };

        const featureFlags = {
            enableSmartSourceDS: true,
            enableTokensInUrl: false,
        };

        const dash = this.state.def ? (
            <DashboardContextProvider preset={customPreset} featureFlags={featureFlags}>
                <DashboardCore
                    width={this.state.width}
                    height="calc(100vh - 78px)"
                    definition={this.state.def}
                    dashboardCoreApiRef={this.props.registerDashboardCoreApi}
                    tokenBinding={this.state.tokenBindings}
                    initialMode="view"
                    key={this.state.random}
                />
            </DashboardContextProvider>
        ) : (
            <></>
        );
        return (
            <div
                tabIndex="0"
                style={
                    this.state.dark
                        ? {
                              textAlign: 'center',
                              margin: 'auto',
                              align: 'center',
                              width: '100%',
                              backgroundColor: '#171D21',
                          }
                        : {
                              textAlign: 'center',
                              margin: 'auto',
                              align: 'center',
                              width: '100%',
                              backgroundColor: '#FFFFFF',
                          }
                }
                onKeyDown={this.onKeyPressed}
            >
                <SplunkThemeProvider
                    family="enterprise"
                    colorScheme={this.state.dark ? 'dark' : 'light'}
                    density="compact"
                >
                    <table
                        style={{
                            textAlign: 'center',
                            margin: 'auto',
                            align: 'center',
                            width: this.state.width,
                        }}
                    >
                        <tbody>
                            <tr>
                                <td
                                    colSpan="2"
                                    style={{
                                        ...colStyle,
                                        width: '100%',
                                        paddingTop: '0px',
                                        paddingBottom: '0px',
                                    }}
                                >
                                    <>{dash}</>
                                </td>
                            </tr>

                            {this.state.error_no_dash == true ? (
                                <tr>
                                    <td
                                        colSpan="2"
                                        style={{
                                            ...colStyle,
                                            width: '100%',
                                            paddingTop: '0px',
                                            paddingBottom: '0px',
                                        }}
                                    >
                                        <div>
                                            <Message appearance="fill" type="error">
                                                Cannot load dashboard with ID:{' '}
                                                {this.state.dashboardID}.
                                            </Message>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <></>
                            )}
                        </tbody>
                    </table>
                </SplunkThemeProvider>
            </div>
        );
    }
}

export default () => {
    const navigate = useNavigate();
    const dashboardCoreApi = useRef();
    const registerDashboardCoreApi = useCallback((api) => {
        dashboardCoreApi.current = api; // this can be a ref or even state(i used ref here)
    });
    return (
        <TimerVisApp
            navigate={navigate}
            dashboardCoreApi={dashboardCoreApi}
            registerDashboardCoreApi={registerDashboardCoreApi}
        />
    );
};
