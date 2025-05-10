// hooks/useSpeechToText.js
// Quản lý ghi âm và speech-to-text

import {useState, useRef} from 'react';
import {getSTT} from '../services/sttService';
import {logger} from '../utils/logger';

export const useSpeechToText = (sttMethod) => {
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const mediaRecorderRef = useRef(null);

    // Ghi âm
    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();
            setIsRecording(true);

            mediaRecorderRef.current.ondataavailable = async (e) => {
                const audioBlob = e.data; // Lấy trực tiếp từ event
                // Gửi audioBlob tới service
                try {
                    setIsProcessing(true);
                    const result = await getSTT(audioBlob, sttMethod);

                    if (result.success) {
                        setTranscript(result.transcript);
                    } else {
                        setError(result.error);
                        setTranscript('Failed to process audio');
                    }
                } catch (err) {
                    logger.error('Speech to text error:', err);
                    setError('Failed to process audio');
                    setTranscript('');
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
                setIsRecording(false);
            };
        } catch (err) {
            logger.error('Recording error:', err);
            setError(`Could not access microphone: ${err.message}`);
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
        isProcessing,
        error,
        startRecording,
        stopRecording,
    };
};
