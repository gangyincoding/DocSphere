/**
 * 文件上传 API 测试脚本
 * 用法: node test-upload-api.js <username> <password>
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:8000/api';

async function testFileUpload() {
  try {
    // 从命令行参数获取用户名和密码
    const username = process.argv[2] || 'testuser';
    const password = process.argv[3] || 'Test123456';

    console.log('📝 步骤 1: 用户登录...');
    console.log(`   用户名: ${username}`);

    // 1. 登录获取 token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username,
      password
    });

    if (!loginResponse.data.success) {
      console.log('❌ 登录失败，尝试注册新用户...');

      // 如果登录失败，尝试注册
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        username,
        password,
        email: `${username}@test.com`
      });

      if (!registerResponse.data.success) {
        throw new Error('注册失败: ' + registerResponse.data.message);
      }

      console.log('✅ 用户注册成功');

      // 重新登录
      const newLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });

      if (!newLoginResponse.data.success) {
        throw new Error('登录失败: ' + newLoginResponse.data.message);
      }

      var token = newLoginResponse.data.data.accessToken;
    } else {
      var token = loginResponse.data.data.accessToken;
    }

    console.log('✅ 登录成功');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log('');

    // 2. 创建测试文件
    console.log('📝 步骤 2: 创建测试文件...');
    const testFilePath = path.join(__dirname, 'test-upload-file.txt');

    if (!fs.existsSync(testFilePath)) {
      fs.writeFileSync(testFilePath, 'This is a test file for upload validation.\n测试文件内容。');
    }

    console.log(`✅ 测试文件路径: ${testFilePath}`);
    console.log('');

    // 3. 上传文件
    console.log('📝 步骤 3: 上传文件...');

    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('isPublic', 'false');
    formData.append('description', '通过 API 测试脚本上传的文件');

    const uploadResponse = await axios.post(
      `${API_BASE_URL}/files/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ 文件上传成功！');
    console.log('');
    console.log('📄 上传结果:');
    console.log('   文件ID:', uploadResponse.data.data.id);
    console.log('   文件名:', uploadResponse.data.data.originalName);
    console.log('   文件大小:', uploadResponse.data.data.size, 'bytes');
    console.log('   MIME类型:', uploadResponse.data.data.mimeType);
    console.log('   存储路径:', uploadResponse.data.data.path);
    console.log('   是否公开:', uploadResponse.data.data.isPublic ? '是' : '否');
    console.log('');

    // 4. 获取文件列表验证
    console.log('📝 步骤 4: 验证文件列表...');

    const filesResponse = await axios.get(`${API_BASE_URL}/files`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        limit: 10
      }
    });

    console.log('✅ 文件列表获取成功');
    console.log(`   总文件数: ${filesResponse.data.data.pagination.total}`);
    console.log('');

    console.log('🎉 所有测试通过！文件上传功能正常工作。');

  } catch (error) {
    console.error('');
    console.error('❌ 测试失败:');
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   错误信息:', error.response.data?.message || error.response.statusText);
      console.error('   详细信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   错误:', error.message);
    }
    process.exit(1);
  }
}

// 运行测试
testFileUpload();
