// hooks/useSpeechToText.js
// Quản lý ghi âm và speech-to-text

import {useState, useRef} from 'react';
import axios from '../axiosInstance';
import {logger} from '../utils/logger';

export const useSpeechToText = (sttMethod) => {
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);

    // Ghi âm
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();
            setIsRecording(true);

            mediaRecorderRef.current.ondataavailable = async (e) => {
                const audioBlob = e.data; // Lấy trực tiếp từ event
                // Gửi audioBlob tới /stt
                try {
                    const sttResponse = await axios.post(`/stt?method=${sttMethod}`, audioBlob, {
                        headers: {
                            'Content-Type': 'audio/webm',
                        },
                    });
                    setTranscript(sttResponse.data.transcript || '');
                } catch (err) {
                    logger.error('Fetch error:', err.response?.data || err.message);
                    setTranscript('Failed to process audio');
                }
            };

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
                setIsRecording(false);
            };
        } catch (err) {
            logger.error('Error:', err);
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    return {
        transcript,
        setTranscript,
        isRecording,
        startRecording,
        stopRecording,
    };
};
