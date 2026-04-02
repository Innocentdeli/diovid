const fs = require('fs');
const { VertexAI } = require('@google-cloud/vertexai');

// Load env
if (fs.existsSync('.env.local')) {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split('\n').forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
            const [key, ...values] = line.split('=');
            if (key) process.env[key] = values.join('=').trim();
        }
    });
}

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = 'us-central1';

async function probe() {
    console.log(`Probing Gemini 2.0 models for project: ${project}...`);
    const vAI = new VertexAI({ project, location });
    
    const candidates = [
        'gemini-2.0-flash-001',
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash-002',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash'
    ];

    for (const c of candidates) {
        try {
            const model = vAI.preview.getGenerativeModel({ model: c });
            const result = await model.generateContent("hi");
            await result.response;
            console.log(`✅ ${c}: SUCCESS`);
        } catch (e) {
            console.log(`❌ ${c}: ${e.message.substring(0, 150)}`);
        }
    }
}

probe();
