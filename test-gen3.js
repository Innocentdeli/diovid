const { VertexAI } = require('@google-cloud/vertexai');

async function test(location, modelId) {
    try {
        const project = 'project-0f08201b-82f4-4166-ac2';
        const vertexAI = new VertexAI({ project, location });
        const model = vertexAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent("hi");
        const response = await result.response;
        console.log(`✅ ${location} | ${modelId} | SUCCESS`);
        return true;
    } catch (e) {
        console.log(`❌ ${location} | ${modelId} | FAILED: ${e.message.substring(0, 150)}...`);
        return false;
    }
}

async function start() {
    const configs = [
        { loc: 'global', models: ['gemini-3-flash-preview', 'gemini-3-pro-preview'] },
        { loc: 'us-central1', models: ['gemini-2.0-flash-exp', 'gemini-1.5-flash-002'] },
    ];

    console.log("Testing Global & Experimental Endpoints...");
    for (const config of configs) {
        for (const m of config.models) {
            await test(config.loc, m);
        }
    }
}

start();
