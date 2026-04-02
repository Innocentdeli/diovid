const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        process.env[key] = values.join('=').trim();
    }
});

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use the API Key from .env.local
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function test() {
    try {
        console.log('--- Testing Imagen 3 via AI Studio ---');
        // In @google/generative-ai, image generation might be under a different method or restricted
        // Let's list models first to see what is available
        const models = await genAI.listModels();
        console.log('Available Models:');
        models.models.forEach(m => {
            if (m.name.includes('imagen') || m.name.includes('veo') || m.name.includes('flash')) {
                console.log(`- ${m.name}`);
            }
        });
    } catch (e) {
        console.error('❌ ERROR: ', e.message);
    }
}

test();
