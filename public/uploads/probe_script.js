const https = require('https');

const apiKey = 'xhs_8e6434ab674a5ec0240dd094c3cd9c40';
const apiUrl = 'https://wx.limyai.com';

function request(url, options, body) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const req = https.request(urlObj, {
            method: options.method,
            headers: options.headers
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data || '{}');
                    resolve({ status: res.statusCode, json: () => Promise.resolve(json) });
                } catch (e) {
                    resolve({ status: res.statusCode, json: () => Promise.resolve({ error: 'Invalid JSON', raw: data }) });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function run() {
    const results = [];
    try {
        console.log('Fetching accounts...');
        const r = await request(`${apiUrl}/api/openapi/wechat-accounts`, { method: 'POST', headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' } });
        const d = await r.json();
        console.log('Accounts:', JSON.stringify(d));

        if (!d.success || !d.data || !d.data.accounts || d.data.accounts.length === 0) {
            console.error('No accounts found');
            return;
        }
        const wechatAppid = d.data.accounts[0].wechatAppid;

        const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
        const filename = 'test.png';
        const ct = 'image/png';

        // Case A: Abs + Rel
        try {
            console.log('Testing Case A...');
            const payloadA = {
                wechatAppid,
                title: 'Probe A (Abs+Rel)',
                content: '<img src="http://localhost:3000/uploads/test.png" />',
                imageUploads: [{ localPath: '/uploads/test.png', filename, contentType: ct, dataBase64: b64 }],
                articleType: 'news', contentFormat: 'html'
            };
            const rA = await request(`${apiUrl}/api/openapi/wechat-publish`, { method: 'POST', headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' } }, JSON.stringify(payloadA));
            const jsonA = await rA.json();
            results.push({ case: 'A', status: rA.status, json: jsonA });
        } catch (e) { results.push({ case: 'A', error: e.message }); }

        // Case B: Rel + Rel
        try {
            console.log('Testing Case B...');
            const payloadB = {
                wechatAppid,
                title: 'Probe B (Rel+Rel)',
                content: '<img src="/uploads/test.png" />',
                imageUploads: [{ localPath: '/uploads/test.png', filename, contentType: ct, dataBase64: b64 }],
                articleType: 'news', contentFormat: 'html'
            };
            const rB = await request(`${apiUrl}/api/openapi/wechat-publish`, { method: 'POST', headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' } }, JSON.stringify(payloadB));
            const jsonB = await rB.json();
            results.push({ case: 'B', status: rB.status, json: jsonB });
        } catch (e) { results.push({ case: 'B', error: e.message }); }

        // Case C: Abs + Abs
        try {
            console.log('Testing Case C...');
            const payloadC = {
                wechatAppid,
                title: 'Probe C (Abs+Abs)',
                content: '<img src="http://localhost:3000/uploads/test.png" />',
                imageUploads: [{ localPath: 'http://localhost:3000/uploads/test.png', filename, contentType: ct, dataBase64: b64 }],
                articleType: 'news', contentFormat: 'html'
            };
            const rC = await request(`${apiUrl}/api/openapi/wechat-publish`, { method: 'POST', headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' } }, JSON.stringify(payloadC));
            const jsonC = await rC.json();
            results.push({ case: 'C', status: rC.status, json: jsonC });
        } catch (e) { results.push({ case: 'C', error: e.message }); }

        console.log(JSON.stringify(results, null, 2));
        const path = require('path');
        fs.writeFileSync(path.join(__dirname, 'probe_result.json'), JSON.stringify(results, null, 2));

    } catch (e) {
        console.error('Fatal error:', e);
    }
}

run();
