const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        process.env[key] = values.join('=').trim();
    }
});

async function testRest() {
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        console.log('Fetching available models from AI Studio REST API...');
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.error('❌ REST API ERROR:', data.error);
            return;
        }
        
        console.log('Available Models (AI Studio):');
        data.models.forEach(m => {
            console.log(`- ${m.name}`);
        });
    } catch (e) {
        console.error('❌ FETCH ERROR:', e.message);
    }
}

testRest();
