const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  const prisma = new PrismaClient();

  try {
    console.log('🧪 测试Prisma连接...\n');

    // 测试基本连接
    console.log('1. 测试基本连接...');
    await prisma.$connect();
    console.log('✅ Prisma连接成功');

    // 测试模型访问
    console.log('2. 测试模型访问...');
    console.log('可用模型:', Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));

    // 测试APIConfig模型
    console.log('3. 测试APIConfig模型...');
    console.log('aPIConfig类型:', typeof prisma.aPIConfig);
    console.log('findFirst方法:', typeof prisma.aPIConfig?.findFirst);

    // 测试查询
    console.log('4. 测试查询...');
    const configs = await prisma.aPIConfig.findMany({
      take: 1
    });
    console.log('查询结果:', configs.length, '条记录');

    console.log('\n✅ 所有测试通过');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误详情:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();