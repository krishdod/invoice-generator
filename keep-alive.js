// Keep-Alive Script for Render Backend
// This script pings your backend every 10 minutes to prevent it from sleeping

const BACKEND_URL = 'https://invoice-generator-backend-new.onrender.com';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

async function pingBackend() {
    try {
        console.log(`[${new Date().toISOString()}] Pinging backend...`);
        
        const response = await fetch(`${BACKEND_URL}/api/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            console.log(`[${new Date().toISOString()}] ✅ Backend is healthy`);
        } else {
            console.log(`[${new Date().toISOString()}] ⚠️ Backend responded but not healthy:`, data);
        }
    } catch (error) {
        console.log(`[${new Date().toISOString()}] ❌ Failed to ping backend:`, error.message);
    }
}

// Ping immediately when script starts
pingBackend();

// Then ping every 10 minutes
setInterval(pingBackend, PING_INTERVAL);

console.log(`[${new Date().toISOString()}] 🚀 Keep-alive service started`);
console.log(`[${new Date().toISOString()}] 📡 Will ping ${BACKEND_URL} every ${PING_INTERVAL / 60000} minutes`);
