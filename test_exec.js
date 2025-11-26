const { execSync } = require('child_process');
const fs = require('fs');
try {
    console.log('Starting execSync...');
    const out = execSync('echo hello', { encoding: 'utf8' });
    console.log('execSync done, writing file...');
    fs.writeFileSync('test_exec_out.txt', out);
    console.log('File written.');
} catch (e) {
    console.error('Error:', e);
    fs.writeFileSync('test_exec_err.txt', e.message);
}
