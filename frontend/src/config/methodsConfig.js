// config/methodsConfig.js
// Cấu hình các phương thức cho SpeedDial

import SpeechToTextIcon from '@mui/icons-material/RecordVoiceOver';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import TextToSpeechIcon from '@mui/icons-material/VoiceOverOff';

export const methodsConfig = {
    stt: {
        icon: SpeechToTextIcon,
        name: 'Speech-to-Text',
        type: 'stt',
        options: [
            {value: 'assemblyai', label: 'AssemblyAI (API)'},
            {value: 'vosk', label: 'Vosk (Local)'},
        ],
    },

    generate: {
        icon: ModelTrainingIcon,
        name: 'Generate Model',
        type: 'generate',
        options: [
            {value: 'mistral', label: 'Mistral'},
            {value: 'gemini', label: 'Gemini'},
        ],
    },

    tts: {
        icon: TextToSpeechIcon,
        name: 'Text-to-Speech',
        type: 'tts',
        options: [
            {value: 'gtts', label: 'gTTS (Google)'},
            {value: 'piper', label: 'Piper (Local)'},
        ],
    },
};
