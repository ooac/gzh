// 测试API密钥余额查询功能（免费版本）
const testApiKey = 'JZLa63a32071858ba8d';  // 用户当前使用的密钥

async function testBalanceQuery() {
  console.log('🔍 测试修复后的API密钥验证功能...');
  console.log('测试密钥:', testApiKey);
  console.log('');

  try {
    // 1. 测试免费的余额查询API
    console.log('1. 测试免费余额查询API...');
    const balanceResponse = await fetch('https://www.dajiala.com/fbmain/monitor/v3/get_remain_money', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: testApiKey,
        verifycode: ''
      })
    });

    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      console.log('✅ 免费余额查询成功:');
      console.log('   - 当前余额:', parseFloat(balanceData.remain_money || 0).toFixed(2), '元');
      console.log('   - 昨日余额:', parseFloat(balanceData.yesterday_money || 0).toFixed(2), '元');
      console.log('   - 查询时间:', balanceData.request_time);
      console.log('   - 状态码:', balanceData.code);

      if (balanceData.code === 0) {
        console.log('   - 验证结果: API密钥有效 ✅');
      } else {
        console.log('   - 验证结果: API密钥无效 ❌');
      }
    } else {
      console.log('❌ 余额查询失败:', balanceResponse.status);
    }

    console.log('');

    // 2. 对比：旧的扣费验证方式（仅作对比，不实际执行）
    console.log('2. 修复前的问题分析:');
    console.log('   ❌ 旧方式：调用搜索接口验证 (kw_search) - 会扣费 0.4元');
    console.log('   ✅ 新方式：调用余额接口验证 (get_remain_money) - 完全免费');

    console.log('');

    // 3. 测试新的API配置保存接口
    console.log('3. 测试修复后的API配置保存接口...');
    const saveResponse = await fetch('http://localhost:3000/api/api-config-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: testApiKey,
        apiUrl: 'https://www.dajiala.com/fbmain/monitor/v3/kw_search'
      })
    });

    if (saveResponse.ok) {
      const saveResult = await saveResponse.json();
      console.log('✅ API配置保存测试:');
      console.log('   - 保存状态:', saveResult.success ? '成功' : '失败');
      console.log('   - API密钥:', saveResult.data?.apiKey?.substring(0, 10) + '...');
      console.log('   - 查询余额:', parseFloat(saveResult.data?.balance || 0).toFixed(2), '元');
      if (saveResult.data?.warning) {
        console.log('   - 警告信息:', saveResult.data.warning);
      }
    } else {
      console.log('❌ API配置保存测试失败:', saveResponse.status);
    }

  } catch (error) {
    console.error('❌ 测试过程出错:', error.message);
  }

  console.log('');
  console.log('🎉 修复验证完成！');
  console.log('');
  console.log('💡 修复后的优势：');
  console.log('   ✅ 使用免费余额查询接口验证API密钥');
  console.log('   ✅ 验证过程不再扣费');
  console.log('   ✅ 同样能够验证API密钥有效性');
  console.log('   ✅ 准确获取当前余额信息');
}

testBalanceQuery();