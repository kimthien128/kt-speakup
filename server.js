import express from 'express';
import {exec} from 'child_process';
import {writeFileSync} from 'fs';
import cors from 'cors';

const app = express();

app.use(cors()); // Thêm CORS
app.use(express.json());
app.use(express.raw({type: 'audio/webm', limit: '10mb'}));

app.post('/stt', (req, res) => {
    const audioPath = 'input.webm';
    writeFileSync(audioPath, req.body);

    exec('ffmpeg -i input.webm -ar 16000 -ac 1 input.wav', (err) => {
        if (err) return res.status(500).send('FFmpeg error');

        exec('python vosk_server.py', (err, stdout) => {
            if (err) return res.status(500).send('Vosk error');
            res.json({transcript: stdout.trim()});
        });
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));
