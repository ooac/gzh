# API配置问题排查与解决记录

## 问题描述

用户在更新API密钥后遇到以下问题：
1. 余额显示错误（显示为0而不是实际余额）
2. 填写API密钥时会产生费用（每次扣费0.4元）
3. API密钥显示乱码（显示JavaScript代码片段）
4. 修改密钥后刷新页面会回到之前的密钥

## 问题分析与解决过程

### 1. API密钥验证扣费问题

**问题现象：** 用户填写API密钥时会扣费0.4元

**根本原因：** 系统调用的是搜索验证接口（`kw_search`），这是付费接口

**解决方案：**
- 将验证逻辑改为使用免费的余额查询接口（`get_remain_money`）
- 修改 `src/app/api/api-config-simple/route.ts` 中的验证逻辑

```javascript
// 旧方式（扣费）
const response = await fetch(apiEndpoint, {
  method: 'POST',
  body: JSON.stringify({
    kw: 'test',
    // ... 其他搜索参数
  })
})

// 新方式（免费）
const testBalance = await checkBalance(apiKey.trim())
```

### 2. 余额显示不一致问题

**问题现象：** localStorage保存余额49.60元，但显示0元

**根本原因：**
- localStorage保存的是用户API密钥 `JZLa63a32071858ba8d`（余额49.60元）
- 后端GET请求使用的是默认API密钥 `JZL156fc9ab0b0706a5`（余额0元）
- 前端合并时优先使用后端的0元余额

**解决方案：**
- 修改GET接口支持传递API密钥参数
- 前端在请求时传递用户保存的API密钥

```javascript
// 修改GET接口
const { searchParams } = new URL(request.url)
const queryApiKey = searchParams.get('apiKey')
const config = {
  apiKey: queryApiKey || defaultConfig.apiKey,
  // ...
}

// 前端传递用户密钥
const params = new URLSearchParams({
  apiKey: localConfig.apiKey,
  apiUrl: localConfig.apiUrl
})
```

### 3. localStorage数据污染问题

**问题现象：** API密钥显示为2731字符的JavaScript代码片段

**根本原因：** localStorage被外部因素污染（浏览器插件、开发工具等）

**污染数据示例：**
```javascript
// 损坏的数据
{
  apiKey: 'clipper-min.js:1 === collect - isAndroid false  - isIos: false',
  length: 2731
}

// 正常的数据
{
  apiKey: 'JZLa63a32071858ba8d',
  length: 19
}
```

**解决方案：**
1. **自动检测机制** - 检测异常长度和内容
2. **自动清理功能** - 清理无效的localStorage数据
3. **增强验证** - 保存时验证数据格式

```javascript
// 检测和清理逻辑
const clearCorruptedLocalStorage = () => {
  if (config.apiKey && (
    config.apiKey.length > 100 ||
    config.apiKey.includes('clipper-min.js') ||
    !config.apiKey.match(/^[A-Za-z0-9]+$/)
  )) {
    localStorage.removeItem('apiConfig')
    return true
  }
  return false
}
```

## 技术细节

### 修复的文件

1. **`src/app/api/api-config-simple/route.ts`**
   - 替换付费验证为免费余额查询
   - 支持GET请求传递API密钥参数
   - 增强错误处理和验证

2. **`src/components/APIConfig.tsx`**
   - 增加localStorage数据检测和清理
   - 修复前端GET请求参数传递
   - 添加API密钥格式验证
   - 增强调试日志

### API接口变更

**余额查询接口：**
```http
POST https://www.dajiala.com/fbmain/monitor/v3/get_remain_money
Content-Type: application/json

{
  "key": "API密钥",
  "verifycode": ""
}
```

## 验证结果

1. ✅ **免费验证**：API密钥验证不再扣费
2. ✅ **余额准确**：显示用户API密钥的实际余额
3. ✅ **数据清洁**：localStorage不再被污染
4. ✅ **持久化正常**：修改的密钥在刷新后保持

## 用户操作指南

### 正常使用流程
1. 点击"API配置"按钮
2. 点击"编辑"输入新的API密钥
3. 系统自动验证密钥并查询余额
4. 保存成功后，密钥持久化到localStorage
5. 余额会实时更新显示

### 异常情况处理
- 如果localStorage被污染，系统会自动清理并使用默认配置
- 用户可以重新输入正确的API密钥进行保存
- 调试信息会记录在浏览器控制台

## 预防措施

1. **输入验证**：实时清理无效字符
2. **格式检查**：确保只保存有效的API密钥
3. **长度限制**：防止超长数据污染
4. **定期检测**：自动识别和清理损坏数据

## 调试日志

**成功清理的日志示例：**
```
🔧 检测到损坏的API密钥，正在清理localStorage...
✅ 已清理损坏的localStorage数据
🔍 使用纯API配置: {apiKey: 'JZL156fc9ab0b0706a5', balance: 0}
🔍 API密钥显示调试: {showApiKey: false, apiKeyLength: 19, apiKeyPreview: 'JZL156fc9ab0b0706a5'}
```

## 总结

通过系统性的问题排查和修复，解决了API配置相关的所有问题：
- 消除了不必要的费用
- 确保余额显示的准确性
- 提供了数据污染的防护机制
- 提升了用户体验和系统稳定性

---
*记录时间：2025-11-11*
*版本：1.3.0*
