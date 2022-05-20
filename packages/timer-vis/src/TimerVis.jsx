import React, { useEffect, useCallback } from 'react';
import EnterprisePreset from '@splunk/dashboard-presets/EnterprisePreset';
import DashboardCore from '@splunk/dashboard-core';
import { DashboardContextProvider } from '@splunk/dashboard-context';

import CustomTimer from './customTimer';

import Message from '@splunk/react-ui/Message';

import { SplunkThemeProvider } from '@splunk/themes';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';

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
        const res = fetch(src);
        const data = res.buffer();
        const mimeType = res.headers.get('Content-Type');
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

class TimelapseControls extends React.Component {
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
            height: 1000,
            dark: darktheme,
            leftOpen: false,
            openPanelId: 2,
            openInputsPanelId: 2,
            numberOfSearches: 0,
            numberOfSearchesComplete: 0,
            dashboardID: params.get('dashboardid'),
            fullscreen: false,
            fullscreenhandler: props.handle,
        };
        this.fetchDefinition();
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

    handleDarkModeClick(event) {
        this.setState({ dark: !this.state.dark });
    }

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
    openLeftPanel() {
        this.handleRequestOpen('leftOpen');
    }

    handleRequestClose() {
        this.setState({ leftOpen: false });
    }

    handlePanelChange(e, { panelId: panelValue }) {
        this.setState({ openPanelId: panelValue });
    }

    handleInputsPanelChange(e, { panelId: panelValue }) {
        this.setState({ openInputsPanelId: panelValue });
    }

    handleFullScreen() {
        console.log('Full Screen Clicked');
    }

    onKeyPressed(e) {}

    render() {
        const colStyle = {
            border: `0px solid black`,
            padding: 10,
            paddingRight: 20,
            whiteSpace: 'nowrap',
            textAlign: 'center',
        };
        const textStyle = { textAlign: 'center' };

        const customPreset = {
            ...EnterprisePreset,
            visualizations: {
                ...EnterprisePreset.visualizations,
                'splunk.Timer': CustomTimer,
            },
        };

        const dash = (
            <DashboardContextProvider>
                <DashboardCore
                    width={this.state.width}
                    height="calc(100vh - 78px)"
                    definition={this.state.def}
                    preset={customPreset}
                    initialMode="view"
                />
            </DashboardContextProvider>
        );
        return (
            <FullScreen handle={this.state.fullscreenhandler}>
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
            </FullScreen>
        );
    }
}

export default (props) => {
    var handle = useFullScreenHandle();
    return <TimelapseControls handle={handle} def={{}} />;
};
