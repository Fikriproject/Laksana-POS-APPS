
const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/products',
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('BODY:', data.substring(0, 500)); // Log first 500 chars
        try {
            const json = JSON.parse(data);
            if (json.data && json.data.products && json.data.products.length > 0) {
                console.log("Sample Image URL:", json.data.products[0].image_url);
            }
        } catch (e) {
            console.log("Not JSON");
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
