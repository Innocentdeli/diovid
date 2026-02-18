const { VertexAI } = require('@google-cloud/vertexai');

async function testGlobal(modelId) {
    const project = 'project-0f08201b-82f4-4166-ac2';
    // Attempt to hit the global endpoint by NOT providing a region or providing 'global'
    // Some versions of the SDK require apiEndpoint to be set for global
    const vertexAI = new VertexAI({
        project,
        location: 'us-central1', // Keep as base for SDK but override model path or endpoint
        apiEndpoint: 'us-central1-aiplatform.googleapis.com'
    });

    const vertexAIGlobal = new VertexAI({
        project,
        // In many GCP APIs, 'global' is a valid location but needs the base endpoint
        apiEndpoint: 'aiplatform.googleapis.com'
    });

    console.log(`Testing ${modelId} on GLOBAL endpoint...`);
    try {
        // Model ID might need to be the full resource name for global
        const resourceName = `projects/${project}/locations/global/publishers/google/models/${modelId}`;
        const model = vertexAIGlobal.getGenerativeModel({ model: resourceName });

        const result = await model.generateContent("hi");
        const response = await result.response;
        console.log(`✅ SUCCESS: ${modelId} | ${response.candidates[0].content.parts[0].text}`);
        return true;
    } catch (e) {
        console.log(`❌ FAILED ${modelId}: ${e.message.substring(0, 200)}`);
        return false;
    }
}

async function start() {
    const models = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.0-flash-exp'];
    for (const m of models) {
        await testGlobal(m);
    }
}

start();
