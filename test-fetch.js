const API_KEY = process.env.GOOGLE_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

async function test() {
    console.log('Testing fetch to Google AI...');
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] })
        });
        const data = await res.json();
        console.log('Success:', JSON.stringify(data).substring(0, 100));
    } catch (err) {
        console.error('Fetch failed!');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error code:', err.code);
        console.error('Stack:', err.stack);
    }
}

test();
