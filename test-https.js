const https = require('https');
const API_KEY = process.env.GOOGLE_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

function testHttps() {
    console.log('Testing HTTPS module to Google AI...');
    const data = JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] });
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(url, options, (res) => {
        console.log('Status code:', res.statusCode);
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            console.log('Success:', body.substring(0, 100));
        });
    });

    req.on('error', (e) => {
        console.error('HTTPS request failed!');
        console.error(e);
    });

    req.write(data);
    req.end();
}

testHttps();
