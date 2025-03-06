import React, {useState, useRef} from 'react';

function InputArea() {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();
            setIsRecording(true);

            mediaRecorderRef.current.ondataavailable = async (e) => {
                const audioBlob = new Blob([e.data], {type: 'audio/webm'});
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/stt`, {
                        method: 'POST',
                        headers: {'Content-Type': 'audio/webm'},
                        body: audioBlob,
                    });
                    const data = await response.json();
                    if (data.error) {
                        setText(`Error: ${data.error}`);
                    } else {
                        setText(data.transcript);
                    }
                } catch (err) {
                    console.log('Fetch error:', err);
                    setText('Failed to process audio');
                }
            };

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
                setIsRecording(false);
            };
        } catch (err) {
            console.log('Error:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    return (
        <footer className="input-area">
            <button className="record-btn" onClick={isRecording ? stopRecording : startRecording}>
                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
            </button>
            <textarea value={text} onChange={(e) => setText(e.target.value)} />
            <button className="send-btn">Send</button>
        </footer>
    );
}

export default InputArea;
