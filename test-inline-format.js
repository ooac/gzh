// 测试完整的inlineFormat函数
function escapeHtml(input) {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function inlineFormat(line) {
    let s = line;
    const proxify = (u) => {
        try {
            const url = new URL(u);
            const href = url.protocol === 'http:' ? `https://${url.hostname}${url.pathname}${url.search}${url.hash}` : url.toString();
            return `/api/image-proxy?url=${encodeURIComponent(href)}`;
        } catch { return u; }
    };
    const normalizeSrc = (u) => {
        if (!u) return u;
        if (u.startsWith('/uploads/') || u.startsWith('/api/image-proxy')) return u;
        return proxify(u);
    };

    // 测试两个正则
    console.log('\n=== Testing line ===');
    console.log('Input:', line.substring(0, 150) + '...');

    // 第一个正则:带宽高比
    const regex1 = /!\[([^\]]*?)\s+(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)\]\(([^)]+)\)/g;
    const match1 = line.match(regex1);
    console.log('Regex 1 match:', match1 ? 'YES' : 'NO');
    if (match1) {
        console.log('Matched:', match1[0].substring(0, 100) + '...');
    }

    s = s.replace(/!\[([^\]]*?)\s+(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)\]\(([^)]+)\)/g, (_m, a1, a2, a3, a4) => {
        console.log('Replacement called with:');
        console.log('  alt:', a1);
        console.log('  ratio:', `${a2}:${a3}`);
        console.log('  url:', a4.substring(0, 100) + '...');
        const normalized = normalizeSrc(a4);
        console.log('  normalized:', normalized.substring(0, 100) + '...');
        return `<img src="${normalized}" alt="${a1}" style="aspect-ratio: ${a2} / ${a3}; width: 100%; height: auto; object-fit: cover" class="my-3 rounded-md max-w-full" onerror="this.style.display='none'" />`;
    });

    console.log('After regex 1:', s.substring(0, 150) + '...');

    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, a1, a2) => `<img src="${normalizeSrc(a2)}" alt="${a1}" class="my-3 rounded-md max-w-full h-auto" onerror="this.style.display='none'" />`);
    s = s.replace(/!\s*`([^`]+)`/g, (_m, a1) => `<img src="${normalizeSrc(a1)}" alt="" class="my-3 rounded-md max-w-full h-auto" onerror="this.style.display='none'" />`);
    s = s.replace(/!\s*(\S+)/g, (_m, a1) => `<img src="${normalizeSrc(a1)}" alt="" class="my-3 rounded-md max-w-full h-auto" onerror="this.style.display='none'" />`);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-600 underline">$1</a>');

    console.log('Final output:', s.substring(0, 200) + '...');
    return s;
}

// 测试用户的实际内容
const testLine = '![配图 2.35:1](https://s3.siliconflow.cn/default/outputs/afd754a8-bce1-48b6-a0c6-7e8fde7514c1_80e667639e99222fa56478845c761b0e_ComfyUI_688dbeb9_00001_.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAXXXXFILESEXAMPLE%2F20251119%2Fcn-shanghai-1%2Fs3%2Faws4_request&X-Amz-Date=20251119T055439Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host)';

const result = inlineFormat(testLine);
console.log('\n=== FINAL RESULT ===');
console.log(result);
