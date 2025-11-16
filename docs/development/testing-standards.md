# DocSphere 测试规范文档

## 概述

本文档定义了 DocSphere 项目中所有模块和功能的测试标准与规范。确保代码质量、功能可靠性和团队开发一致性。

## 基本原则

### 1. 测试先行原则
- **TDD（测试驱动开发）**：对于核心业务逻辑，优先编写测试用例
- **及时测试**：功能模块开发完成后，必须立即编写对应的测试用例
- **覆盖完整**：不允许有任何未测试的业务逻辑代码

### 2. 测试金字塔
```
    E2E Tests (10%)
   ┌─────────────────┐
  │  集成测试 (20%)   │
 ┌─────────────────────┐
│   单元测试 (70%)      │
└───────────────────────┘
```

### 3. 质量标准
- **代码覆盖率**：单元测试覆盖率不低于 80%
- **分支覆盖率**：不低于 75%
- **函数覆盖率**：不低于 90%
- **关键业务逻辑**：必须达到 100% 覆盖

## 测试类型定义

### 1. 单元测试 (Unit Tests)
**目的**：测试独立的函数、类或模块

**规范**：
- 文件命名：`**/*.test.ts` 或 `**/*.spec.ts`
- 存放位置：与源文件同目录或 `src/tests/unit/`
- 测试隔离：每个测试用例相互独立
- 模拟依赖：使用 Jest Mock 模拟外部依赖

**示例**：
```typescript
// 文件位置：src/utils/calculator.ts
export const add = (a: number, b: number): number => a + b;

// 测试文件：src/utils/calculator.test.ts
describe('Calculator Utils', () => {
  describe('add', () => {
    it('应该正确相加两个正数', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('应该正确处理负数', () => {
      expect(add(-1, 1)).toBe(0);
    });
  });
});
```

### 2. 集成测试 (Integration Tests)
**目的**：测试多个模块协同工作的正确性

**规范**：
- 文件命名：`**/*.integration.test.ts`
- 存放位置：`src/tests/integration/`
- 测试真实的数据库、API 等外部依赖
- 使用测试数据库或 Docker 容器

**示例**：
```typescript
// 测试用户注册和认证的集成测试
describe('User Authentication Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('应该完成完整的用户注册流程', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    // 注册用户
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);
    expect(registerResponse.status).toBe(201);

    // 验证用户可以登录
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.token).toBeDefined();
  });
});
```

### 3. 端到端测试 (E2E Tests)
**目的**：从用户角度验证完整的业务流程

**规范**：
- 文件命名：`**/*.e2e.test.ts`
- 存放位置：`src/tests/e2e/`
- 使用 Cypress 或 Playwright
- 模拟真实用户操作

## 模块测试规范

### 1. 后端模块

#### API 控制器测试
```typescript
describe('User Controller', () => {
  let mockUserService: jest.Mocked<UserService>;
  let controller: UserController;

  beforeEach(() => {
    mockUserService = {
      createUser: jest.fn(),
      getUserById: jest.fn(),
      // ... 其他方法
    };
    controller = new UserController(mockUserService);
  });

  describe('createUser', () => {
    it('应该创建新用户并返回用户信息', async () => {
      // Arrange
      const userData = { email: 'test@example.com', name: 'Test' };
      const expectedUser = { id: 1, ...userData };
      mockUserService.createUser.mockResolvedValue(expectedUser);

      const mockReq = { body: userData } as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any;

      // Act
      await controller.createUser(mockReq, mockRes);

      // Assert
      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expectedUser
      });
    });
  });
});
```

#### 服务层测试
```typescript
describe('User Service', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let service: UserService;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      // ... 其他方法
    };
    service = new UserService(userRepository);
  });

  describe('createUser', () => {
    it('应该创建用户并哈希密码', async () => {
      // Arrange
      const userData = { email: 'test@example.com', password: 'password' };
      const hashedPassword = 'hashed_password';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);
      userRepository.create.mockResolvedValue({ id: 1, ...userData });

      // Act
      const result = await service.createUser(userData);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword
      });
      expect(result).toEqual({ id: 1, ...userData });
    });
  });
});
```

#### 数据库模型测试
```typescript
describe('User Model', () => {
  let sequelize: Sequelize;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:');
    await User.init(sequelize);
    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('应该正确验证用户数据', async () => {
    // 测试必填字段
    await expect(User.create({})).rejects.toThrow();

    // 测试邮箱格式验证
    await expect(User.create({
      email: 'invalid-email',
      password: 'password'
    })).rejects.toThrow();
  });
});
```

### 2. 前端模块

#### 组件测试
```typescript
describe('UserProfile Component', () => {
  let mockUser: User;

  beforeEach(() => {
    mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    };
  });

  it('应该正确显示用户信息', () => {
    render(<UserProfile user={mockUser} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('应该处理编辑操作', async () => {
    const onEdit = jest.fn();
    render(<UserProfile user={mockUser} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));

    expect(onEdit).toHaveBeenCalledWith(mockUser.id);
  });
});
```

#### Hook 测试
```typescript
describe('useUser Hook', () => {
  it('应该正确获取用户数据', async () => {
    const mockUser = { id: 1, name: 'Test User' };
    jest.spyOn(userApi, 'getUser').mockResolvedValue(mockUser);

    const { result } = renderHook(() => useUser(1));

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });
});
```

## 测试数据管理

### 1. 测试夹具 (Fixtures)
```typescript
// fixtures/user.ts
export const createTestUser = (overrides?: Partial<User>): User => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed_password',
  ...overrides
});

// 使用示例
describe('User Tests', () => {
  it('应该使用测试夹具', () => {
    const user = createTestUser({ email: 'custom@example.com' });
    expect(user.email).toBe('custom@example.com');
  });
});
```

### 2. 测试数据库
- 使用独立的测试数据库
- 每个测试套件前后清理数据
- 使用事务进行数据隔离

### 3. Mock 策略
```typescript
// 全局 Mock
jest.mock('../../utils/logger');
jest.mock('../../config/database');

// 局部 Mock
const mockEmailService = {
  sendWelcomeEmail: jest.fn()
} as jest.Mocked<EmailService>;

// 条件 Mock
if (process.env.NODE_ENV === 'test') {
  jest.mock('../../services/external-api');
}
```

## 开发流程约束

### 1. 提交前检查
```json
// package.json hooks
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run test:unit",
      "pre-push": "npm run test:ci"
    }
  },
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ]
  }
}
```

### 2. CI/CD 集成
- **Pull Request**：必须通过所有测试
- **合并到主分支**：覆盖率必须达标
- **生产部署**：必须通过完整测试套件

### 3. Code Review 清单
- [ ] 是否有对应的测试用例？
- [ ] 测试覆盖率是否达标？
- [ ] 测试是否覆盖边界情况？
- [ ] Mock 是否正确？
- [ ] 测试是否独立且可重复？

## 测试最佳实践

### 1. 命名规范
```typescript
// ✅ 好的命名
describe('UserService.createUser', () => {
  it('当用户数据有效时，应该创建用户', () => {});
  it('当邮箱已存在时，应该抛出错误', () => {});
});

// ❌ 不好的命名
describe('User', () => {
  it('test 1', () => {});
  it('should work', () => {});
});
```

### 2. AAA 模式
```typescript
it('应该验证用户输入', () => {
  // Arrange - 准备测试数据
  const invalidEmail = 'invalid-email';

  // Act - 执行被测代码
  const result = validateEmail(invalidEmail);

  // Assert - 验证结果
  expect(result).toBe(false);
});
```

### 3. 测试隔离
- 每个测试用例独立运行
- 不要依赖其他测试的状态
- 使用 beforeEach/afterEach 清理状态

### 4. 错误测试
```typescript
it('应该正确处理错误情况', async () => {
  // 测试异常
  await expect(service.createInvalidUser()).rejects.toThrow(ValidationError);

  // 测试错误响应
  const response = await request(app).post('/invalid-endpoint');
  expect(response.status).toBe(404);
});
```

## 工具和库推荐

### 后端测试
- **Jest**：单元测试和集成测试框架
- **Supertest**：API 端点测试
- **@types/jest**：TypeScript 类型定义
- **jest-mock-extended**：增强的 Mock 功能

### 前端测试
- **Jest + React Testing Library**：组件测试
- **Cypress**：端到端测试
- **MSW (Mock Service Worker)**：API Mock
- **@testing-library/user-event**：用户交互测试

### 测试工具
- **Coverage Reporter**：覆盖率报告
- **Husky + lint-staged**：Git hooks
- **SonarQube**：代码质量分析
- **GitHub Actions**：CI/CD 测试流水线

## 测试环境配置

### 后端环境
```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  }
};
```

### 前端环境
```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

## 监控和报告

### 1. 覆盖率报告
- 生成 HTML 格式的覆盖率报告
- 集成到 CI/CD 流水线
- 设置覆盖率阈值警告

### 2. 测试性能监控
- 监控测试执行时间
- 识别慢速测试用例
- 优化测试性能

### 3. 测试失败分析
- 自动化失败报告
- 趋势分析和预警
- 团队测试质量统计

## 总结

本测试规范文档确保了 DocSphere 项目的测试质量和一致性。所有开发人员必须严格遵守这些规范，在开发过程中：

1. **功能完成** → **立即编写测试**
2. **测试通过** → **代码审查**
3. **审查通过** → **合并代码**

通过这种方式，我们可以确保项目的长期稳定性和可维护性。