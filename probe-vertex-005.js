const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        process.env[key] = values.join('=').trim();
    }
});
const { VertexAI } = require('@google-cloud/vertexai');

const project = process.env.GOOGLE_CLOUD_PROJECT || 'project-0f08201b-82f4-4166-ac2';
const locations = ['us-east1', 'us-west1', 'europe-west1'];

async function listModels() {
    for (const location of locations) {
        try {
            console.log(`\nProbing Vertex AI in ${location}...`);
            const variations = ['imagen-3.0-generate-001', 'imagegeneration@006'];
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
            console.error(`❌ ERROR in ${location}: `, e.message);
        }
    }
}

listModels();
