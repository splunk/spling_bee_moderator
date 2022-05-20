import React, { useEffect, useState, useRef } from 'react';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

import Button from '@splunk/react-ui/Button';
import https from 'https';

const agent = new https.Agent({
    rejectUnauthorized: false,
});

var username = 'service_account';
var password = 'timer_00';

const Timer = (props) => {
    const vizRef = useRef();

    const [isPlaying, setIsPlaying] = useState(false);
    const [key, setKey] = useState(0);

    var style = { align: 'center', textAlign: 'center', margin: 'auto' };

    async function sendReset() {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });

        var key = await fetch('https://localhost:8089/services/auth/login', {
            method: 'POST',
            body: new URLSearchParams({
                username: username,
                password: password,
                output_mode: 'json',
            }),
            httpsAgent: agent,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                return data['sessionKey'];
            });

        const body = await fetch(
            `https://localhost:8089/services/receivers/simple?index=main&sourcetype=timer_status`,
            {
                method: 'POST',
                body: 'event=reset ' + window.location.search,
                httpsAgent: agent,
                headers: { Authorization: `Splunk ${key}` },
            }
        );
    }
    async function startTimer() {
        setIsPlaying(true);

        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });

        var key = await fetch('https://localhost:8089/services/auth/login', {
            method: 'POST',
            body: new URLSearchParams({
                username: username,
                password: password,
                output_mode: 'json',
            }),
            httpsAgent: agent,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                return data['sessionKey'];
            });

        const body = await fetch(
            `https://localhost:8089/services/receivers/simple?index=main&sourcetype=timer_status`,
            {
                method: 'POST',
                body: 'event=start ' + window.location.search,
                httpsAgent: agent,
                headers: { Authorization: `Splunk ${key}` },
            }
        );
    }

    async function stopTimer() {
        setIsPlaying(false);

        var key = await fetch('https://localhost:8089/services/auth/login', {
            method: 'POST',
            body: new URLSearchParams({
                username: username,
                password: password,
                output_mode: 'json',
            }),
            httpsAgent: agent,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                return data['sessionKey'];
            });

        const body = await fetch(
            `https://localhost:8089/services/receivers/simple?index=main&sourcetype=timer_status`,
            {
                method: 'POST',
                body: 'event=stop ' + window.location.search,
                httpsAgent: agent,
                headers: { Authorization: `Splunk ${key}` },
            }
        );
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
                                    duration={120}
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
                                        setKey((prevKey) => prevKey + 1);
                                        setIsPlaying(false);
                                        sendReset();
                                    }}
                                />
                            </td>
                        </tr>
                    </tbody>
                    <tr>
                        <td colSpan="3"></td>
                    </tr>
                </table>
                <svg>
                    <defs>
                        <linearGradient id="your-unique-id" x1="1" y1="0" x2="0" y2="0">
                            <stop offset="5%" stopColor="#ab006b" />
                            <stop offset="95%" stopColor="#ec008c" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </>
    );
};

export default Timer;
