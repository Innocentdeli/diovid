const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        process.env[key] = values.join('=').trim();
    }
});
const { VertexAI } = require('@google-cloud/vertexai');

const project = process.env.GOOGLE_CLOUD_PROJECT || 'diovid-project';
const location = 'europe-west1';

async function listModels() {
    try {
        console.log(`Listing Vertex AI models in ${project} / ${location}...`);
        const variations = [
            'imagen-3.0-generate-001',
            'imagegeneration@006'
        ];
        
        const vAI = new VertexAI({ project, location });
        
        for (const v of variations) {
            try {
                const model = vAI.preview.getGenerativeModel({ model: v });
                const result = await model.generateContent("a dot");
                await result.response;
                console.log(`✅ ${v} is AVAILABLE in ${location}`);
            } catch (e) {
                console.log(`❌ ${v} failed in ${location}: ${e.message.substring(0, 100)}`);
            }
        }
    } catch (e) {
        console.error('❌ ERROR: ', e.message);
    }
}

listModels();
