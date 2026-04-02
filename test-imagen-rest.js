const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        process.env[key] = values.join('=').trim();
    }
});

async function testImagen() {
    const apiKey = process.env.GOOGLE_API_KEY;
    // Note: Imagen 3 through AI Studio uses a specific endpoint
    const model = 'imagen-3.0-generate-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
    
    const body = {
        instances: [
            { prompt: "a simple blue dot" }
        ],
        parameters: {
            sampleCount: 1
        }
    };
    
    try {
        console.log(`Testing Imagen 3 via AI Studio REST API...`);
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        if (data.error) {
            console.error('❌ IMAGEN ERROR:', JSON.stringify(data.error, null, 2));
            return;
        }
        
        console.log('✅ IMAGEN SUCCESS! Results found.');
        // If it works, it returns a list of images in base64
    } catch (e) {
        console.error('❌ FETCH ERROR:', e.message);
    }
}

testImagen();
