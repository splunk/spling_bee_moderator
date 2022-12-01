import React from 'react';
import SplunkVisualization from '@splunk/visualizations/common/SplunkVisualization';
import Timer from './timer';

const CustomTimer = ({ dataSources, options }) => {
    return <Timer dataSources={dataSources} options={options} />;
};

CustomTimer.propTypes = {
    ...SplunkVisualization.propTypes,
};

CustomTimer.defaultProps = {
    ...SplunkVisualization.defaultProps,
};

export default CustomTimer;
