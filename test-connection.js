const fetch = require('node-fetch');

async function testConnection() {
    try {
        console.log('Testing frontend to backend connection...');
        const response = await fetch('https://invoice-generator-backend-new.onrender.com/api/health', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Origin': 'https://jai-chammunda-invoice-generator.vercel.app'
            }
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('CORS Headers:', response.headers.get('access-control-allow-origin'));
    } catch (error) {
        console.error('Connection failed:', error.message);
    }
}

testConnection();
