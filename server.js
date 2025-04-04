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
    const p = `A realistic video of a person fluently signing in American Sign Language (ASL). The person is signing the sentence: '${data.prompt}.' The setting is a well-lit, neutral background to focus on the hand movements and facial expressions. The individual uses expressive body language and precise hand gestures, accurately conveying the meaning of the sentence in ASL. Ensure the signing is natural and fluid, with no writing or drawing motions—focus entirely on ASL hand signs and facial expressions as part of the communication.`

    let generation = await client.generations.create({
        prompt: p,
        model: "ray-flash-2",
        resolution: "720p",
        duration: "9s",
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
