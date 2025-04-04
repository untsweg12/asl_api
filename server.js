import 'dotenv/config';
import express from 'express'
import { LumaAI } from 'lumaai';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;
const EXTENSION_ID = process.env.EXTENSION_ID;

const corsOptions = {
    origin: `chrome-extension://${EXTENSION_ID}`,
    methods: "GET,POST",
};

app.use(cors(corsOptions));
app.use(express.json());

app.post('/api/asl/video-gen', async (req, res) => {
    const client = new LumaAI({
        authToken: process.env.LUMAAI_API_KEY
    });
    const data = req.body;

    let generation = await client.generations.create({
        prompt: `An asl tutor [a man in business casual attire] positioned in the middle of the frame, signing this sentence: \"${data.prompt}\".`,
        model: "ray-flash-2",
        resolution: "720p",
        duration: "9s",
        loop: true,
    });

    let completed = false;

    while (!completed) {
        generation = await client.generations.get(generation.id);

        if (generation.state === "completed") {
            completed = true;
        } else if (generation.state === "failed") {
            return res.status(500).json({ message: `Failed to generate video: ${generation["failure_reason"]}` });
        } else {
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    const videoUrl = generation.assets.video;
    res.status(200).json({ videoUrl });
});

app.get("/", (req, res) => {
    res.send(`<h1>ASL Video Generation Server</h1>
    <p>This server is used to generate videos using the Luma AI API.</p>`);
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
