const { VertexAI } = require('@google-cloud/vertexai');

async function test(region, modelId) {
    try {
        const project = 'project-0f08201b-82f4-4166-ac2';
        const vertexAI = new VertexAI({ project, location: region });
        const model = vertexAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent("test");
        const response = await result.response;
        console.log(`✅ ${region} | ${modelId} | SUCCESS`);
        return true;
    } catch (e) {
        if (e.message.includes("404")) {
            console.log(`❌ ${region} | ${modelId} | 404 NOT FOUND`);
        } else if (e.message.includes("403")) {
            console.log(`❌ ${region} | ${modelId} | 403 FORBIDDEN/DISABLED`);
        } else {
            console.log(`❌ ${region} | ${modelId} | ERROR: ${e.message.substring(0, 50)}...`);
        }
        return false;
    }
}

async function start() {
    const regions = [
        'us-central1',
        'us-east4',
        'us-east1',
        'europe-west1',
        'europe-west4',
        'europe-west9',
        'asia-northeast1'
    ];
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-002',
        'gemini-1.0-pro'
    ];

    console.log("Starting Deep Regional Diagnostic...");
    for (const r of regions) {
        for (const m of models) {
            const ok = await test(r, m);
            if (ok) {
                console.log(`\n🎉 FOUND IT! Use Region: ${r}, Model: ${m}`);
                // Keep testing to see if there are better ones
            }
        }
    }
    console.log("\nDiagnostic Complete.");
}

start();
