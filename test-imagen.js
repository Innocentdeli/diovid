const { VertexAI } = require('@google-cloud/vertexai');

async function testImagen(location) {
    const project = 'project-0f08201b-82f4-4166-ac2';
    const vertexAI = new VertexAI({
        project,
        location,
        apiEndpoint: location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`
    });

    console.log(`Testing Imagen on ${location} endpoint...`);
    try {
        const model = vertexAI.getGenerativeModel({ model: 'imagegeneration@006' });
        // Note: for Imagen we use the predict/generateContent depending on SDK version
        // But we just want to see if the model is FOUND.
        const result = await model.generateContent("a cinematic sunset");
        const response = await result.response;
        console.log(`✅ SUCCESS: Imagen on ${location}`);
        return true;
    } catch (e) {
        console.log(`❌ FAILED Imagen on ${location}: ${e.message.substring(0, 200)}`);
        return false;
    }
}

async function start() {
    await testImagen('global');
    await testImagen('us-central1');
    await testImagen('europe-west1');
}

start();
