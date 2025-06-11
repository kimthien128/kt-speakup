// config/methodsConfig.js
// Cấu hình các phương thức cho SpeedDial

import SpeechToTextIcon from "@mui/icons-material/RecordVoiceOver";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import TextToSpeechIcon from "@mui/icons-material/VoiceOverOff";
import BookIcon from "@mui/icons-material/Book";

export const methodsConfig = {
  stt: {
    icon: SpeechToTextIcon,
    name: "Speech-to-Text",
    type: "stt",
    options: [
      { value: "assemblyai", label: "AssemblyAI (API)" },
      { value: "google", label: "Google Text to Speech (API)" },
      { value: "vosk", label: "Vosk (Local)" },
    ],
  },

  generate: {
    icon: ModelTrainingIcon,
    name: "Generate Model",
    type: "generate",
    options: [
      { value: "chatgpt", label: "Chat GPT" },
      { value: "deepseek", label: "DeepSeek" },
      { value: "gemini", label: "Gemini" },
      { value: "mistral", label: "Mistral" },
      { value: "openrouter", label: "OpenRouter" },
    ],
  },

  tts: {
    icon: TextToSpeechIcon,
    name: "Text-to-Speech",
    type: "tts",
    options: [
      { value: "gtts", label: "gTTS (Google)" },
      { value: "piper", label: "Piper (Local)" },
    ],
  },

  dictionary: {
    icon: BookIcon,
    name: "Dictionary Source",
    type: "dictionary",
    options: [
      { value: "dictionaryapi", label: "Dictionary API" },
      { value: "wordnik", label: "Wordnik" },
    ],
  },
};
