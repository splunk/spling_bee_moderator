import React from 'react';
import SplunkVisualization from '@splunk/visualizations/common/SplunkVisualization';
import Timer from './timer';

const CustomTimer = ({
    dataSources,
    width,
    height,
    background = 'transparent',
    title,
    description,
    options,
}) => {
    return <Timer dataSources={dataSources} options={options} />;
};

CustomTimer.propTypes = {
    ...SplunkVisualization.propTypes,
};

CustomTimer.defaultProps = {
    ...SplunkVisualization.defaultProps,
};

export default CustomTimer;
