const { VertexAI } = require('@google-cloud/vertexai');

async function testModel(region, modelId) {
    const project = 'project-0f08201b-82f4-4166-ac2';
    const vertexAI = new VertexAI({ project, location: region });

    console.log(`Testing ${modelId} in ${region}...`);
    try {
        const model = vertexAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent("hi");
        const response = await result.response;
        console.log(`✅ Success in ${region}: ${response.candidates[0].content.parts[0].text}`);
        return true;
    } catch (e) {
        // console.error(`❌ Failure in ${region}: ${e.message}`);
        return false;
    }
}

async function runTests() {
    const regions = ['us-central1', 'us-east1', 'us-east4', 'us-west1', 'europe-west1', 'europe-west4'];
    const models = ['gemini-1.5-flash-002', 'gemini-1.5-flash'];

    for (const r of regions) {
        for (const m of models) {
            const success = await testModel(r, m);
            if (success) {
                console.log(`RECOMMENDED CONFIG: Region=${r}, Model=${m}`);
                process.exit(0);
            }
        }
    }
    console.log("No working region/model found.");
}

runTests();
