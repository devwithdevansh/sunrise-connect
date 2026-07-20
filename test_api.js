const http = require('https');

console.log("==========================================");
console.log("   API CONNECTIVITY & FIREWALL TEST");
console.log("==========================================\n");

function testEndpoint(name, path, userAgent) {
    return new Promise((resolve) => {
        console.log(`Testing [${name}] with User-Agent: "${userAgent}"`);
        const req = http.request(`https://linen-weasel-242678.hostingersite.com${path}`, {
            method: 'GET',
            headers: { 'User-Agent': userAgent }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`-> HTTP Status: ${res.statusCode}`);
                if (data.startsWith('<!DOCTYPE html>')) {
                    console.log(`-> Response Type: HTML (This is Hostinger's Firewall/CAPTCHA page!)`);
                } else if (data.startsWith('{')) {
                    console.log(`-> Response Type: JSON (This is our Node.js Backend working correctly)`);
                    console.log(`-> JSON Data: ${data.trim()}`);
                } else {
                    console.log(`-> Response: ${data.trim()}`);
                }
                console.log("------------------------------------------");
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log(`-> Connection Error: ${e.message}`);
            console.log("------------------------------------------");
            resolve();
        });

        req.end();
    });
}

async function runTests() {
    // Test 1: Simulate the old Flutter app (Dart User-Agent)
    await testEndpoint(
        "Old Flutter App Request", 
        "/api/v1/students?parentId=6a55d04fcb583fa431569940", 
        "Dart/3.12 (dart:io)"
    );

    // Test 2: Simulate the updated Flutter app (Custom User-Agent)
    await testEndpoint(
        "Updated Flutter App Request", 
        "/api/v1/students?parentId=6a55d04fcb583fa431569940", 
        "SunriseConnectApp/1.0.0"
    );

    // Test 3: Simulate a standard web browser
    await testEndpoint(
        "Standard Web Browser Request", 
        "/api/v1/students?parentId=6a55d04fcb583fa431569940", 
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    );

    console.log("\nIf you see JSON with a 401 error (Missing Authorization header), it means the API code is working perfectly and correctly rejecting unauthorized access.");
    console.log("If you see HTML with a 403 error, it means Hostinger's Firewall intercepted and blocked the request before it even reached the code.");
}

runTests();
