import logo from './logo.svg';
import React from 'react';
import Button from './Button';
import TopBar, { MUTE_BUTTON_STATE_UNMUTE, MUTE_BUTTON_STATE_MUTE, MUTE_BUTTON_STATE_CONNECTING, MUTE_BUTTON_STATE_MUTED_BY_ADMIN } from './TopBar';
import './App.css';

class App extends React.Component {

    constructor(props) {
        super(props);

        this.topBarRef = React.createRef();
        this.buttonRef = React.createRef();
    }

    componentDidMount() {
        this.setAmplitude(0.0);
    }

    setCurrentState = (stateId, animated) => {
        const { current: topBar } = this.topBarRef;
        const { current: button } = this.buttonRef;

        topBar.setCurrentState(stateId, animated);
        button.updateMuteButton(stateId, animated);
    };

    setAmplitude(value) {
        const { current: topBar } = this.topBarRef;
        const { current: button } = this.buttonRef;
        if (!topBar) return;

        topBar.setAmplitude(value);
        button.setAmplitude(value);
        document.getElementById('text').innerHTML = (Math.round(value * 100) / 100).toFixed(2);
    }

    handleZeroAmplitude = () => {
        this.setAmplitude(0.0);
    };

    handleHalfAmplitude = () => {
        this.setAmplitude(0.5);
    };

    handleFullAmplitude = () => {
        this.setAmplitude(1.0);
    };

    handleMicrophone = async () => {

        if (this.stream) {
            console.log('stop mic');
            this.stream.getAudioTracks().forEach(x => {
                x.stop();
            });
            this.microphone.disconnect();
            this.analyser.disconnect();
            this.javascriptNode.disconnect();

            this.stream = null;
            this.microphone = null;
            this.analyser = null
            this.javascriptNode = null;
            return;
        }

        console.log('start mic');
        const stream = await navigator.mediaDevices.getUserMedia ({ audio: true, video: false });
        this.stream = stream;
        stream.getTracks().forEach(x => {
            x.onmute = x => {

            };
            x.onunmute = x => {
            };

            x.enabled = true;
        });

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        this.analyser = analyser;
        const microphone = audioContext.createMediaStreamSource(stream);
        this.microphone = microphone;
        const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
        this.javascriptNode = javascriptNode;

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);
        javascriptNode.onaudioprocess = event =>  {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);

            const length = array.length;
            let total = 0;
            let total2 = 0;
            for (let i = 0; i < length; i++) {
                total += array[i] * array[i];
                total2 += Math.abs(array[i]);
            }

            const rms = Math.sqrt(total / length) / 255;
            const average = total2 / length / 255;
            const first = array[0] / 255;

            let value = rms * 2;
            value = Math.min(1, value);

            // console.log('', rms, average, value);

            this.setAmplitude(value);
        }
    };

    handleUnmuted = () => {
        this.setCurrentState(MUTE_BUTTON_STATE_UNMUTE, true);
    }

    handleMuted = () => {
        this.setCurrentState(MUTE_BUTTON_STATE_MUTE, true);
    }

    handleMutedByAdmin = () => {
        this.setCurrentState(MUTE_BUTTON_STATE_MUTED_BY_ADMIN, true);
    }

    handleConnecting = () => {
        this.setCurrentState(MUTE_BUTTON_STATE_CONNECTING, true);
    }

    render() {
        return (
            <div className='App'>
                <TopBar ref={this.topBarRef}/>
                <Button ref={this.buttonRef}/>
                <div className='panel'>
                    <button onClick={this.handleZeroAmplitude}>0.0</button>
                    <button onClick={this.handleHalfAmplitude}>0.5</button>
                    <button onClick={this.handleFullAmplitude}>1.0</button>
                    <button onClick={this.handleUnmuted}>unmute</button>
                    <button onClick={this.handleMuted}>mute</button>
                    <button onClick={this.handleMutedByAdmin}>mute by admin</button>
                    <button onClick={this.handleConnecting}>connecting</button>
                    <button onClick={this.handleMicrophone}>mic</button>
                    <div id='text'/>
                </div>
            </div>
        );
    }
}

export default App;
