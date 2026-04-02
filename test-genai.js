const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        process.env[key] = values.join('=').trim();
    }
});

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function test() {
    try {
        console.log('Testing gemini-2.0-flash...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: 'Hello!'
        });
        console.log('Gemini OK: ', response.text);

    } catch (e) {
        console.error('Error: ', e);
    }
}
test();
