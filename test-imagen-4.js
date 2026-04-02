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
    const model = 'imagen-4.0-generate-001';
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
        console.log(`Testing [${model}] via AI Studio REST API...`);
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        if (data.error) {
            console.error('❌ ERROR:', JSON.stringify(data.error, null, 2));
            return;
        }
        
        console.log('✅ SUCCESS! Generated images data found.');
    } catch (e) {
        console.error('❌ FETCH ERROR:', e.message);
    }
}

testImagen();
