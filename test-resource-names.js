const { VertexAI } = require('@google-cloud/vertexai');

async function test(location, modelId) {
    try {
        const project = 'project-0f08201b-82f4-4166-ac2';
        const vertexAI = new VertexAI({ project, location });
        // Try both short and long names
        const modelsToTry = [
            modelId,
            `publishers/google/models/${modelId}`
        ];

        for (const m of modelsToTry) {
            console.log(`Testing ${location} | ${m}...`);
            try {
                const model = vertexAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("hi");
                const response = await result.response;
                console.log(`✅ SUCCESS: ${location} | ${m}`);
                return true;
            } catch (inner) {
                console.log(`❌ FAILED: ${location} | ${m} | ${inner.message.substring(0, 50)}...`);
            }
        }
        return false;
    } catch (e) {
        console.log(`❌ ERROR: ${location} | ${modelId} | ${e.message.substring(0, 50)}...`);
        return false;
    }
}

async function start() {
    const configs = [
        { loc: 'global', models: ['gemini-1.5-flash-002', 'gemini-2.0-flash-exp'] },
        { loc: 'us-central1', models: ['gemini-1.5-flash-002', 'gemini-2.0-flash-exp'] },
    ];

    for (const config of configs) {
        for (const m of config.models) {
            await test(config.loc, m);
        }
    }
}

start();
