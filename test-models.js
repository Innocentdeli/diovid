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
console.log(`CURRENT PROJECT ID IN CONFIG: ${project}`);
console.log(`CURRENT REGION IN CONFIG: ${process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'}`);

async function testVertexModel(region, modelId, prompt) {
    try {
        console.log(`\n--- Testing Vertex AI [${modelId}] in [${region}] ---`);
        const vAI = new VertexAI({ project, location: region });
        const model = vAI.preview.getGenerativeModel({ model: modelId });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log(`✅ SUCCESS: `, response?.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50) || "Data exists");
    } catch (e) {
        console.error(`❌ ERROR: ${e.message}`);
        if (e.status) console.error(`Status Code: ${e.status}`);
    }
}

async function run() {
    await testVertexModel('us-central1', 'gemini-2.0-flash-001', 'hi');
    await testVertexModel('us-central1', 'imagen-3.0-generate-001', 'a simple square');
    await testVertexModel('us-central1', 'veo-3.1-generate-001', 'a simple movement');
}

run();
