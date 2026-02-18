const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const apiKey = 'AIzaSyDoJqB6CLyNWHhJNgBO3PEwGdf5aAaj_RI';
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // Unfortunately @google/generative-ai doesn't have a direct listModels method
        // We have to use the REST API or try common aliases
        const testModels = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro',
            'gemini-1.5-pro-latest',
            'gemini-pro',
            'gemini-1.0-pro'
        ];

        console.log("Testing models for Google AI Studio API Key...");
        for (const modelId of testModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelId });
                const result = await model.generateContent("hi");
                console.log(`✅ ${modelId} is ACTIVE`);
            } catch (e) {
                console.log(`❌ ${modelId} failed: ${e.message.substring(0, 100)}...`);
            }
        }
    } catch (e) {
        console.error("General error:", e);
    }
}

listModels();
