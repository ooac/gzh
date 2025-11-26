
import urllib.request
import urllib.error

endpoints = [
    '/api/openapi/upload-image',
    '/api/openapi/wechat-upload-image',
    '/api/openapi/wechat-image-upload',
    '/api/openapi/wechat-upload',
    '/api/openapi/wechat-media-upload',
    '/api/openapi/upload',
    '/api/openapi/media/upload',
    '/api/openapi/assets/upload',
    '/api/upload/image',
    '/api/upload',
    '/api/wechat/upload',
    '/api/wechat/image/upload',
    '/api/openapi/wechat/upload',
    '/api/openapi/wechat/image',
    '/api/openapi/wechat/upload-image',
    '/api/openapi/wechat/image-upload',
    '/api/openapi/wechat/media/upload',
    '/api/openapi/wechat/assets/upload',
    '/api/v1/upload',
    '/api/v1/image/upload',
    '/api/v1/wechat/upload'
    '/api/openapi/wechat-material-upload',
    '/api/openapi/wechat-add-material',
    '/api/openapi/material/upload',
    '/api/openapi/wechat/material/upload',
    '/api/openapi/wechat/add-material',
    '/api/openapi/wechat-images',
    '/api/openapi/wechat-image',
    '/api/openapi/wechat-assets',
    '/api/openapi/wechat-asset',
    '/api/openapi/wechat-resources',
    '/api/openapi/wechat-resource',
    '/api/openapi/wechat-files',
    '/api/openapi/wechat-file',
    '/api/openapi/wechat-publish/image',
    '/api/openapi/wechat-publish/upload',
    '/api/openapi/wechat/publish/image',
    '/upload',
    '/upload-image',
    '/wechat/upload',
    '/wechat/upload-image',
    '/api/openapi/wechat/upload-image',
    '/api/openapi/wechat/image-upload'
]

import json
import ssl

# Ignore SSL certificate errors
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

base_url = 'https://wx.limyai.com'
api_key = 'xhs_8e6434ab674a5ec0240dd094c3cd9c40'
data = json.dumps({'filename': 'test.jpg', 'contentType': 'image/jpeg', 'dataBase64': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='}).encode('utf-8')

for endpoint in endpoints:
    url = base_url + endpoint
    try:
        req = urllib.request.Request(url, data=data, method='POST')
        req.add_header('Content-Type', 'application/json')
        req.add_header('X-API-Key', api_key)
        with urllib.request.urlopen(req, context=ctx) as response:
            print(f"{endpoint}: {response.status}")
            print(response.read().decode('utf-8')[:100])
    except urllib.error.HTTPError as e:
        print(f"{endpoint}: {e.code}")
    except Exception as e:
        print(f"{endpoint}: Error {e}")
