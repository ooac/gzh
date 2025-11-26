const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPIConfig() {
  try {
    console.log('🧪 测试API配置功能...\n');

    // 1. 查看现有配置
    console.log('📋 查看现有API配置:');
    const existingConfigs = await prisma.aPIConfig.findMany({
      where: { service: 'wechat' },
      orderBy: { updatedAt: 'desc' }
    });

    console.log(`找到 ${existingConfigs.length} 个配置:`);
    existingConfigs.forEach(config => {
      console.log(`- ID: ${config.id}`);
      console.log(`  API Key: ${config.apiKey?.substring(0, 10)}...`);
      console.log(`  Balance: ${config.balance}`);
      console.log(`  Active: ${config.isActive}`);
      console.log(`  Updated: ${new Date(config.updatedAt).toLocaleString()}`);
      console.log('');
    });

    // 2. 测试获取活跃配置
    console.log('🔍 获取当前活跃配置:');
    const activeConfig = await prisma.aPIConfig.findFirst({
      where: {
        service: 'wechat',
        isActive: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (activeConfig) {
      console.log('找到活跃配置:');
      console.log(`- API Key: ${activeConfig.apiKey?.substring(0, 10)}...`);
      console.log(`- API URL: ${activeConfig.apiUrl}`);
      console.log(`- Balance: ${activeConfig.balance}`);
    } else {
      console.log('❌ 没有找到活跃配置');
    }

    console.log('\n✅ 测试完成');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIConfig();