// 测试图片和标题在同一行的情况
const testLine = '![配图 2.35:1](https://s3.siliconflow.cn/test.png)# 孩子成绩优异却心事重重,我们该做些什么?';

const regex1 = /!\[([^\]]*?)\s+(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)\]\(([^)]+)\)/g;

console.log('Testing line with title after image:');
console.log('Input:', testLine);
console.log('');

const match = testLine.match(regex1);
console.log('Match result:', match);

if (match) {
    console.log('Matched text:', match[0]);

    // 测试替换
    const result = testLine.replace(regex1, (_m, a1, a2, a3, a4) => {
        console.log('Captured groups:');
        console.log('  a1 (alt):', a1);
        console.log('  a2 (width):', a2);
        console.log('  a3 (height):', a3);
        console.log('  a4 (url):', a4);
        return `<img src="${a4}" alt="${a1}" />`;
    });

    console.log('');
    console.log('Result after replacement:', result);
}
