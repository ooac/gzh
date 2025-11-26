
const https = require('https');

const paths = [
    '/api/openapi/upload',
    '/api/openapi/image-upload',
    '/api/openapi/images/upload',
    '/api/openapi/file/upload',
    '/api/openapi/media/upload',
    '/api/openapi/upload/image',
    '/api/openapi/wechat/upload',
    '/api/openapi/wechat/image'
];

const host = 'wx.limyai.com';

paths.forEach(path => {
    const options = {
        hostname: host,
        port: 443,
        path: path,
        method: 'POST'
    };

    const req = https.request(options, (res) => {
        console.log(`Path: ${path} - Status: ${res.statusCode}`);
    });

    req.on('error', (e) => {
        console.error(`Path: ${path} - Error: ${e.message}`);
    });

    req.end();
});
