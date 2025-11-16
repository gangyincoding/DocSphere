# 测试指南

本指南详细说明了 DocSphere 项目的测试策略、测试类型、测试工具和最佳实践。

## 🎯 测试策略

### 测试金字塔

```
    /\
   /E2E\     <- 少量端到端测试
  /______\
 /Integration\ <- 适量集成测试
/______________\
/   Unit Tests   \ <- 大量单元测试
```

- **单元测试**: 70-80% - 快速、独立、细粒度
- **集成测试**: 15-20% - 测试组件间交互
- **端到端测试**: 5-10% - 测试完整用户流程

### 测试目标

1. **代码质量**: 确保代码质量符合标准
2. **功能正确性**: 验证功能按预期工作
3. **回归检测**: 防止新代码破坏现有功能
4. **性能验证**: 确保性能满足要求
5. **安全测试**: 发现潜在安全问题

## 🧪 测试类型

### 1. 单元测试

单元测试专注于测试单个函数、组件或模块的功能。

#### 前端单元测试

**工具栈**:
- **Jest**: 测试框架
- **React Testing Library**: React 组件测试
- **@testing-library/jest-dom**: DOM 断言扩展

**测试文件结构**:
```
src/
├── components/
│   ├── FileUpload/
│   │   ├── index.tsx
│   │   ├── __tests__/
│   │   │   ├── FileUpload.test.tsx
│   │   │   └── hooks/
│   │   │       └── useFileUpload.test.ts
│   │   └── utils/
│   │       └── fileHelper.test.ts
```

**组件测试示例**:
```typescript
// components/FileUpload/__tests__/FileUpload.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from '../index';
import * as fileService from '../../../services/fileService';

// Mock 文件服务
jest.mock('../../../services/fileService');
const mockUploadFile = fileService.uploadFile as jest.MockedFunction<typeof fileService.uploadFile>;

describe('FileUpload', () => {
  const defaultProps = {
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onProgress: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('应该正确渲染默认状态', () => {
      render(<FileUpload {...defaultProps} />);

      expect(screen.getByText(/点击或拖拽文件到此区域上传/)).toBeInTheDocument();
    });

    it('应该渲染自定义内容', () => {
      const customContent = <div>自定义上传区域</div>;
      render(<FileUpload {...defaultProps}>{customContent}</FileUpload>);

      expect(screen.getByText('自定义上传区域')).toBeInTheDocument();
    });

    it('应该在多文件模式下显示相应提示', () => {
      render(<FileUpload {...defaultProps} multiple />);

      expect(screen.getByText(/支持单个或批量上传/)).toBeInTheDocument();
    });
  });

  describe('文件选择测试', () => {
    it('应该处理文件选择', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      mockUploadFile.mockResolvedValue({
        id: '1',
        name: 'test.txt',
        size: 4,
        type: 'text/plain',
        url: 'http://example.com/test.txt',
        uploadedAt: new Date()
      });

      render(<FileUpload {...defaultProps} />);

      const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledWith(
          file,
          '/api/files/upload',
          expect.any(Object)
        );
      });
    });

    it('应该验证文件大小', async () => {
      const largeFile = new File(['a'.repeat(3 * 1024 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain'
      });

      render(
        <FileUpload
          {...defaultProps}
          maxSize={2 * 1024 * 1024 * 1024}
        />
      );

      const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              message: expect.stringContaining('文件大小不能超过')
            })
          })
        );
      });
    });
  });

  describe('进度显示测试', () => {
    it('应该显示上传进度', async () => {
      let progressCallback: (loaded: number, total: number) => void;

      mockUploadFile.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            progressCallback(50, 100);
            setTimeout(() => {
              resolve({
                id: '1',
                name: 'test.txt',
                size: 100,
                type: 'text/plain',
                url: 'http://example.com/test.txt',
                uploadedAt: new Date()
              });
            }, 100);
          }, 100);

          return {
            onProgress: (callback) => {
              progressCallback = callback;
            }
          };
        });
      });

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      render(<FileUpload {...defaultProps} />);

      const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });
  });
});
```

**Hook 测试示例**:
```typescript
// hooks/useFileUpload.test.ts
import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from '../useFileUpload';
import * as fileService from '../../../services/fileService';

jest.mock('../../../services/fileService');

describe('useFileUpload', () => {
  const defaultProps = {
    maxSize: 2 * 1024 * 1024 * 1024,
    accept: ['*/*'],
    uploadPath: '/api/files/upload',
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onProgress: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该初始化正确的默认状态', () => {
    const { result } = renderHook(() => useFileUpload(defaultProps));

    expect(result.current.files).toEqual([]);
    expect(result.current.uploadingFiles).toEqual([]);
    expect(result.current.completedFiles).toEqual([]);
    expect(result.current.errors).toEqual([]);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.dragOver).toBe(false);
  });

  it('应该处理拖拽事件', () => {
    const { result } = renderHook(() => useFileUpload(defaultProps));

    act(() => {
      result.current.handleDragOver({
        preventDefault: jest.fn()
      } as any);
    });

    expect(result.current.dragOver).toBe(true);

    act(() => {
      result.current.handleDragLeave({
        preventDefault: jest.fn()
      } as any);
    });

    expect(result.current.dragOver).toBe(false);
  });
});
```

#### 后端单元测试

**工具栈**:
- **Jest**: 测试框架
- **Supertest**: HTTP 接口测试
- **MongoDB Memory Server**: 测试数据库

**服务层测试示例**:
```typescript
// services/__tests__/FileService.test.ts
import { FileService } from '../FileService';
import { FileRepository } from '../repositories/FileRepository';
import { MinioService } from '../MinioService';

jest.mock('../repositories/FileRepository');
jest.mock('../MinioService');

describe('FileService', () => {
  let fileService: FileService;
  let mockFileRepository: jest.Mocked<FileRepository>;
  let mockMinioService: jest.Mocked<MinioService>;

  beforeEach(() => {
    mockFileRepository = new FileRepository() as jest.Mocked<FileRepository>;
    mockMinioService = new MinioService() as jest.Mocked<MinioService>;
    fileService = new FileService(mockFileRepository, mockMinioService);
  });

  describe('uploadFile', () => {
    it('应该成功上传文件', async () => {
      const file = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 4,
        buffer: Buffer.from('test')
      } as Express.Multer.File;

      const expectedUploadResult = {
        id: '1',
        name: 'test.txt',
        size: 4,
        mimeType: 'text/plain',
        path: 'uploads/test.txt',
        uploadedAt: new Date()
      };

      mockMinioService.uploadFile.mockResolvedValue('uploads/test.txt');
      mockFileRepository.create.mockResolvedValue(expectedUploadResult);

      const result = await fileService.uploadFile(file, 'user123');

      expect(mockMinioService.uploadFile).toHaveBeenCalledWith(file);
      expect(mockFileRepository.create).toHaveBeenCalledWith({
        name: 'test.txt',
        originalName: 'test.txt',
        path: 'uploads/test.txt',
        size: 4,
        mimeType: 'text/plain',
        ownerId: 'user123'
      });
      expect(result).toEqual(expectedUploadResult);
    });

    it('应该处理上传失败', async () => {
      const file = {
        fieldname: 'file',
        originalname: 'test.txt',
        size: 4,
        buffer: Buffer.from('test')
      } as Express.Multer.File;

      const error = new Error('Upload failed');
      mockMinioService.uploadFile.mockRejectedValue(error);

      await expect(fileService.uploadFile(file, 'user123')).rejects.toThrow('Upload failed');
    });
  });
});
```

### 2. 集成测试

集成测试测试多个组件或服务之间的交互。

#### API 集成测试

```typescript
// __tests__/integration/api.test.ts
import request from 'supertest';
import { app } from '../../app';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('应该成功登录并返回 token', async () => {
      // 创建测试用户
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.username).toBe('testuser');
    });

    it('应该拒绝错误的密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/files/upload', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      authToken = loginResponse.body.data.token;
    });

    it('应该成功上传文件', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('test.txt');
      expect(response.body.data.mimeType).toBe('text/plain');
    });

    it('应该拒绝未认证的上传请求', async () => {
      await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(401);
    });
  });
});
```

#### 前端集成测试

```typescript
// __tests__/integration/FileManager.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { FileManager } from '../../pages/FileManager';
import { fileSlice } from '../../store/slices/fileSlice';

// Mock API
jest.mock('../../services/fileService');

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      file: fileSlice.reducer
    },
    preloadedState: initialState
  });
};

const renderWithProviders = (
  component: React.ReactElement,
  { initialState = {} } = {}
) => {
  const store = createTestStore(initialState);

  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('FileManager Integration', () => {
  it('应该完整展示文件管理流程', async () => {
    renderWithProviders(<FileManager />);

    // 验证页面加载
    expect(screen.getByText('文件管理')).toBeInTheDocument();

    // 测试文件上传
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const uploadInput = screen.getByLabelText('上传文件');

    fireEvent.change(uploadInput, {
      target: { files: [file] }
    });

    // 等待上传完成
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    // 测试文件选择
    const fileItem = screen.getByText('test.txt');
    fireEvent.click(fileItem);

    // 验证文件详情显示
    expect(screen.getByText('文件详情')).toBeInTheDocument();
  });
});
```

### 3. 端到端测试

E2E 测试使用 Cypress 测试完整的用户流程。

#### Cypress 配置

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: false,
    viewportWidth: 1280,
    viewportHeight: 720,
    env: {
      apiUrl: 'http://localhost:8000/api/v1'
    }
  }
});
```

#### E2E 测试示例

```typescript
// cypress/e2e/file-management.cy.ts
describe('文件管理 E2E 测试', () => {
  beforeEach(() => {
    // 登录
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type('admin');
    cy.get('[data-testid="password-input"]').type('admin123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('应该完成完整的文件上传和管理流程', () => {
    // 导航到文件管理页面
    cy.get('[data-testid="nav-files"]').click();
    cy.url().should('include', '/files');

    // 上传文件
    cy.get('[data-testid="upload-button"]').click();
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test.txt');
    cy.get('[data-testid="confirm-upload"]').click();

    // 验证文件上传成功
    cy.get('[data-testid="file-list"]').should('contain', 'test.txt');

    // 测试文件预览
    cy.get('[data-testid="file-test.txt"]').click();
    cy.get('[data-testid="file-preview"]').should('be.visible');

    // 测试文件下载
    cy.get('[data-testid="download-button"]').click();

    // 测试文件删除
    cy.get('[data-testid="delete-button"]').click();
    cy.get('[data-testid="confirm-delete"]').click();
    cy.get('[data-testid="file-list"]').should('not.contain', 'test.txt');
  });

  it('应该处理文件搜索和过滤', () => {
    // 上传多个测试文件
    const files = [
      'cypress/fixtures/document.pdf',
      'cypress/fixtures/image.jpg',
      'cypress/fixtures/spreadsheet.xlsx'
    ];

    files.forEach(file => {
      cy.get('[data-testid="upload-button"]').click();
      cy.get('input[type="file"]').selectFile(file);
      cy.get('[data-testid="confirm-upload"]').click();
    });

    // 测试搜索功能
    cy.get('[data-testid="search-input"]').type('document');
    cy.get('[data-testid="file-list"]').should('contain', 'document.pdf');
    cy.get('[data-testid="file-list"]').should('not.contain', 'image.jpg');

    // 清除搜索
    cy.get('[data-testid="clear-search"]').click();
    cy.get('[data-testid="file-list"]').should('contain', 'image.jpg');

    // 测试类型过滤
    cy.get('[data-testid="filter-pdf"]').click();
    cy.get('[data-testid="file-list"]').should('contain', 'document.pdf');
    cy.get('[data-testid="file-list"]').should('not.contain', 'image.jpg');
  });
});
```

## 🛠️ 测试工具和配置

### Jest 配置

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/serviceWorker.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### 测试环境设置

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// 配置 Testing Library
configure({ testIdAttribute: 'data-testid' });

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## 📊 测试覆盖率

### 覆盖率目标

- **单元测试**: > 80%
- **集成测试**: > 70%
- **整体覆盖率**: > 75%

### 覆盖率报告

```bash
# 生成覆盖率报告
pnpm run test:coverage

# 查看详细覆盖率报告
open coverage/lcov-report/index.html
```

### 覆盖率配置

```javascript
// jest.config.js 中的覆盖率配置
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  './src/components/': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85
  },
  './src/services/': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  }
}
```

## 🔄 持续集成测试

### GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: 测试

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: 使用 Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: 安装依赖
      run: pnpm install

    - name: 运行 lint
      run: pnpm run lint

    - name: 运行类型检查
      run: pnpm run type-check

    - name: 运行单元测试
      run: pnpm run test:unit -- --coverage

    - name: 运行集成测试
      run: pnpm run test:integration

    - name: 上传覆盖率报告
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
```

## 🎯 测试最佳实践

### 1. 测试原则

- **FIRST 原则**:
  - **Fast**: 测试应该快速执行
  - **Independent**: 测试之间应该相互独立
  - **Repeatable**: 测试结果应该可重复
  - **Self-Validating**: 测试应该有明确的通过/失败结果
  - **Timely**: 测试应该及时编写

### 2. 测试结构

```typescript
// 遵循 AAA 模式：Arrange, Act, Assert
describe('组件功能', () => {
  it('应该执行特定行为', () => {
    // Arrange - 准备测试数据和模拟
    const mockData = { id: 1, name: 'test' };
    jest.spyOn(service, 'getData').mockResolvedValue(mockData);

    // Act - 执行被测试的操作
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));

    // Assert - 验证结果
    expect(screen.getByText('expected text')).toBeInTheDocument();
    expect(service.getData).toHaveBeenCalled();
  });
});
```

### 3. Mock 策略

```typescript
// Mock 外部依赖
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock 部分功能
jest.spyOn(console, 'log').mockImplementation();

// 清理 Mock
afterEach(() => {
  jest.clearAllMocks();
});
```

### 4. 异步测试

```typescript
// 测试异步操作
it('应该处理异步操作', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expectedValue);
});

// 使用 waitFor 等待 DOM 更新
it('应该等待 DOM 更新', async () => {
  render(<Component />);
  fireEvent.click(screen.getByRole('button'));

  await waitFor(() => {
    expect(screen.getByText('加载完成')).toBeInTheDocument();
  });
});
```

### 5. 测试数据管理

```typescript
// 使用工厂函数创建测试数据
const createUser = (overrides = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides
});

// 使用 fixtures 管理测试文件
const fixtures = {
  validFile: new File(['content'], 'test.txt', { type: 'text/plain' }),
  largeFile: new File(['x'.repeat(1000000)], 'large.txt', { type: 'text/plain' })
};
```

## 🚀 性能测试

### 前端性能测试

```typescript
// 性能测试示例
describe('性能测试', () => {
  it('应该在大数据量下保持性能', () => {
    const startTime = performance.now();

    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    render(<Component items={largeData} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(100); // 渲染时间应小于100ms
  });
});
```

### API 性能测试

```typescript
// 使用 Artillery 进行 API 性能测试
const artilleryConfig = {
  config: {
    target: 'http://localhost:8000',
    phases: [
      { duration: 60, arrivalRate: 10 }
    ]
  },
  scenarios: [
    {
      name: '文件上传',
      weight: 100,
      flow: [
        {
          post: {
            url: '/api/auth/login',
            json: {
              username: 'test',
              password: 'password'
            }
          }
        },
        {
          post: {
            url: '/api/files/upload',
            formData: {
              file: '@test.txt'
            }
          }
        }
      ]
    }
  ]
};
```

## 📝 测试报告

### 生成测试报告

```bash
# 生成 JUnit 格式报告
pnpm run test -- --reporters=default --reporters=jest-junit

# 生成 HTML 报告
pnpm run test -- --reporters=default --reporters=html
```

### 测试报告分析

- **覆盖率趋势**: 监控覆盖率变化
- **测试通过率**: 确保测试稳定性
- **执行时间**: 监控测试执行时间
- **失败分析**: 分析测试失败原因

---

通过遵循本测试指南，您可以确保 DocSphere 项目的代码质量和稳定性。记住，好的测试是项目成功的关键！🎯