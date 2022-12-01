import React, { useState } from 'react';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import Button from '@splunk/react-ui/Button';

const Timer = (props) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [key, setKey] = useState(0);

    var style = { align: 'center', textAlign: 'center', margin: 'auto' };

    async function startTimer() {
        setIsPlaying(true);
    }

    async function stopTimer() {
        setIsPlaying(false);
    }

    const renderTime = ({ remainingTime }) => {
        if (remainingTime === 0) {
            return <div className="timer">Done</div>;
        }

        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <div style={{ fontSize: '40px' }}>{remainingTime}</div>
                <br />
                <div style={{ color: '#aaa' }}>Seconds Remaining</div>
            </div>
        );
    };

    return (
        <>
            <div style={style}>
                <table>
                    <tbody>
                        <tr style={style}>
                            <td colSpan="3">
                                <CountdownCircleTimer
                                    key={key}
                                    isPlaying={isPlaying}
                                    duration={props.options.range}
                                    colors="url(#your-unique-id)"
                                    colorsTime={[7, 5, 2, 0]}
                                >
                                    {renderTime}
                                </CountdownCircleTimer>{' '}
                            </td>
                        </tr>
                        <tr style={style}>
                            <td style={style}>
                                {isPlaying ? (
                                    <Button
                                        disabled
                                        label="Start"
                                        appearance="primary"
                                        onClick={startTimer}
                                    />
                                ) : (
                                    <Button
                                        label="Start"
                                        appearance="primary"
                                        onClick={startTimer}
                                    />
                                )}
                            </td>
                            <td style={style}>
                                {isPlaying ? (
                                    <Button
                                        label="Stop"
                                        appearance="destructive"
                                        onClick={stopTimer}
                                    />
                                ) : (
                                    <Button
                                        disabled
                                        label="Stop"
                                        appearance="destructive"
                                        onClick={stopTimer}
                                    />
                                )}
                            </td>
                            <td style={style}>
                                <Button
                                    label="Reset"
                                    appearance="destructive"
                                    onClick={() => {
                                        setKey((prevKey) => {
                                            return prevKey + 1;
                                        });
                                        setIsPlaying(false);
                                    }}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
                <svg>
                    <defs>
                        <linearGradient id="your-unique-id" x1="1" y1="0" x2="0" y2="0">
                            <stop offset="1%" stopColor="#ED0080" />{' '}
                            <stop offset="40%" stopColor="#ED0080" />
                            <stop offset="80%" stopColor="#F05A22" />
                            <stop offset="99%" stopColor="#F99D1C" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </>
    );
};

export default Timer;
