# 贡献指南

欢迎为 DocSphere 项目做出贡献！我们感谢所有形式的贡献，包括但不限于代码、文档、测试、设计建议等。

## 🎯 贡献方式

### 代码贡献
- 🐛 修复 Bug
- ✨ 新功能开发
- 🚀 性能优化
- 🔧 代码重构
- 📝 文档更新

### 非代码贡献
- 🐛 报告 Bug
- 💡 功能建议
- 📖 文档改进
- 🎨 UI/UX 设计建议
- 🌍 国际化翻译
- 📋 测试用例编写

## 🚀 快速开始

### 1. Fork 项目

1. 访问 [DocSphere GitHub 仓库](https://github.com/your-org/docsphere)
2. 点击右上角的 "Fork" 按钮
3. 将项目克隆到本地：

```bash
git clone https://github.com/YOUR_USERNAME/docsphere.git
cd docsphere
```

### 2. 设置开发环境

参考 [快速开始指南](./quick-start.md) 搭建开发环境。

### 3. 创建开发分支

```bash
# 确保主分支是最新的
git checkout main
git pull upstream main

# 创建功能分支
git checkout -b feature/your-feature-name

# 或者创建修复分支
git checkout -b fix/issue-number-description
```

## 📋 开发流程

### 分支命名规范

- `feature/功能名称` - 新功能开发
- `fix/问题描述` - Bug 修复
- `docs/文档更新` - 文档更新
- `style/代码格式` - 代码格式化
- `refactor/重构说明` - 代码重构
- `test/测试相关` - 测试相关
- `chore/构建工具` - 构建工具或依赖更新

### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Type 类型
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式化（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建工具、依赖更新等

#### 示例
```bash
feat(file): add support for drag and drop upload
fix(auth): resolve token expiration issue
docs(api): update authentication endpoints documentation
style(components): fix linting errors in FileUpload component
test(user): add unit tests for user service
chore(deps): update react to v18.2.0
```

### 开发步骤

1. **编写代码**
   - 遵循项目的代码规范
   - 编写测试用例
   - 更新相关文档

2. **运行测试**
   ```bash
   # 运行所有测试
   pnpm run test

   # 运行代码检查
   pnpm run lint

   # 检查类型错误
   pnpm run type-check
   ```

3. **提交代码**
   ```bash
   # 添加修改的文件
   git add .

   # 提交代码（遵循提交信息规范）
   git commit -m "feat(feature): add new feature description"

   # 推送到远程仓库
   git push origin feature/your-feature-name
   ```

4. **创建 Pull Request**
   - 在 GitHub 上创建 Pull Request
   - 填写详细的 PR 描述
   - 等待代码审查

## 🔍 Pull Request 规范

### PR 标题
遵循与提交信息相同的规范：
- `feat: 添加文件拖拽上传功能`
- `fix: 修复用户认证token过期问题`

### PR 描述模板

```markdown
## 📝 变更描述
简要描述本次变更的内容和目的。

## 🐛 问题修复 (如果适用)
- 修复的问题编号: #123
- 问题描述:
- 修复方案:

## ✨ 新功能 (如果适用)
- 功能描述:
- 使用方法:
- 测试步骤:

## 🔄 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 代码重构
- [ ] 文档更新
- [ ] 性能优化
- [ ] 其他

## 🧪 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成
- [ ] 测试覆盖率满足要求

## 📸 截图 (如果适用)
请添加相关截图说明变更效果。

## ✅ 检查清单
- [ ] 代码遵循项目规范
- [ ] 已添加必要的测试
- [ ] 文档已更新
- [ ] 无类型错误
- [ ] 无 linting 错误
- [ ] 已自测功能

## 📋 相关 Issue
Closes #123
```

## 📝 代码规范

### TypeScript 规范

1. **类型定义**
   ```typescript
   // ✅ 使用 interface 定义对象类型
   interface User {
     id: string;
     name: string;
     email: string;
   }

   // ✅ 使用 type 定义联合类型
   type Status = 'active' | 'inactive' | 'suspended';

   // ❌ 避免使用 any
   const data: any = fetchData(); // 避免

   // ✅ 使用具体类型或 unknown
   const data: unknown = fetchData(); // 推荐
   ```

2. **函数定义**
   ```typescript
   // ✅ 明确的参数和返回类型
   function calculateTotal(price: number, quantity: number): number {
     return price * quantity;
   }

   // ✅ 使用泛型
   function createApiResponse<T>(data: T, success: boolean) {
     return { data, success };
   }
   ```

3. **组件规范**
   ```typescript
   // ✅ 使用函数组件和 Props 接口
   interface ButtonProps {
     children: React.ReactNode;
     onClick: () => void;
     variant?: 'primary' | 'secondary';
   }

   const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary' }) => {
     return <button onClick={onClick}>{children}</button>;
   };
   ```

### React 组件规范

1. **组件结构**
   ```typescript
   import React, { useState, useEffect, useCallback } from 'react';
   import { Button, Input } from 'antd';

   interface ComponentProps {
     // Props 定义
   }

   /**
   * 组件描述
   */
   const Component: React.FC<ComponentProps> = ({
     // Props 解构
   }) => {
     // Hooks
     const [state, setState] = useState();

     // 事件处理函数
     const handleClick = useCallback(() => {
       // 处理逻辑
     }, []);

     // 副作用
     useEffect(() => {
       // 副作用逻辑
       return () => {
         // 清理函数
       };
     }, []);

     // 渲染
     return (
       <div>
         {/* JSX 内容 */}
       </div>
     );
   };

   Component.displayName = 'Component';

   export default Component;
   ```

2. **Hooks 使用**
   ```typescript
   // ✅ 自定义 Hook 以 use 开头
   const useFileUpload = () => {
     // Hook 逻辑
   };

   // ✅ 使用 useCallback 优化性能
   const handleClick = useCallback(() => {
     // 处理逻辑
   }, [dependencies]);

   // ✅ 使用 useMemo 缓存计算结果
   const expensiveValue = useMemo(() => {
     return heavyComputation(data);
   }, [data]);
   ```

### CSS/Less 规范

1. **BEM 命名规范**
   ```less
   // ✅ 块（Block）
   .file-upload {}

   // ✅ 元素（Element）
   .file-upload__button {}

   // ✅ 修饰符（Modifier）
   .file-upload--disabled {}
   .file-upload__button--primary {}
   ```

2. **组织结构**
   ```less
   .component {
     // 布局属性
   display: flex;
   position: relative;

   // 盒模型属性
   width: 100%;
   padding: 16px;
   margin: 0;

   // 视觉属性
   color: #333;
   background-color: #fff;
   border: 1px solid #ddd;

   // 动画属性
   transition: all 0.3s ease;

   // 嵌套元素
   &__element {
     // 元素样式
   }

   // 修饰符
   &--modifier {
     // 修饰符样式
   }

   // 伪类
   &:hover,
   &:focus {
     // 伪类样式
   }
   }
   ```

### 后端代码规范

1. **文件结构**
   ```
   src/
   ├── controllers/     # 控制器
   ├── services/        # 业务逻辑
   ├── models/          # 数据模型
   ├── middleware/      # 中间件
   ├── routes/          # 路由定义
   ├── utils/           # 工具函数
   ├── types/           # 类型定义
   └── config/          # 配置文件
   ```

2. **控制器规范**
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   import { FileService } from '../services/FileService';

   export class FileController {
     constructor(private fileService: FileService) {}

     public upload = async (req: Request, res: Response, next: NextFunction) => {
       try {
         const result = await this.fileService.upload(req.file);
         res.json({
           success: true,
           data: result
         });
       } catch (error) {
         next(error);
       }
     };
   }
   ```

## 🧪 测试规范

### 单元测试

1. **文件命名**: `__tests__/ComponentName.test.ts` 或 `ComponentName.test.ts`
2. **测试结构**:
   ```typescript
   describe('ComponentName', () => {
     describe('method1', () => {
       it('should do something when condition is met', () => {
         // 测试代码
       });
     });
   });
   ```

3. **测试覆盖率**: 单元测试覆盖率应 > 80%

### 集成测试

1. **API 测试**: 使用 Jest + Supertest
2. **数据库测试**: 使用测试数据库
3. **文件操作测试**: 使用临时文件

### E2E 测试

1. **工具**: Cypress 或 Playwright
2. **测试场景**: 覆盖关键用户流程
3. **浏览器支持**: Chrome, Firefox, Safari

## 📖 文档贡献

### 文档类型

1. **API 文档**: 更新 API 接口文档
2. **用户文档**: 更新用户使用指南
3. **开发文档**: 更新开发指南和架构文档
4. **README**: 更新项目说明和快速开始

### 文档规范

1. **使用 Markdown**
2. **清晰的标题结构**
3. **代码示例和截图**
4. **链接有效性检查**

## 🐛 报告 Bug

### Bug 报告模板

```markdown
## 🐛 Bug 描述
清晰简洁地描述 Bug 的情况

## 🔄 复现步骤
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 🎯 期望行为
描述您期望发生的情况

## 📸 截图
如果适用，添加截图来帮助解释问题

## 🖥️ 环境信息
- 操作系统: [例如 iOS]
- 浏览器: [例如 chrome, safari]
- 版本: [例如 22]

## 📋 附加信息
添加任何其他关于问题的信息
```

## 💡 功能建议

### 功能建议模板

```markdown
## 🚀 功能描述
清晰简洁地描述您希望添加的功能

## 💡 解决的问题
这个功能解决了什么问题？为什么需要它？

## 📝 详细描述
提供功能的详细描述，包括：
- 用户界面设计
- 功能流程
- 配置选项

## 🎨 设计参考
如果有的话，提供设计稿或参考

## 🔄 替代方案
描述您考虑过的其他替代解决方案

## 📋 附加信息
添加任何其他关于功能请求的信息
```

## 🏆 贡献者认可

### 贡献类型

- 💻 代码贡献
- 📖 文档贡献
- 🐛 Bug 报告
- 💡 功能建议
- 🎨 设计贡献
- 🌍 翻译贡献
- 📋 测试贡献
- 💰 赞助支持

### 认可方式

- 在 README 中列出贡献者
- 在发布说明中感谢贡献者
- 定期的贡献者报告
- 社区表彰

## 📞 获取帮助

如果您在贡献过程中遇到问题：

1. **查看文档**: [项目文档](../README.md)
2. **搜索 Issue**: [GitHub Issues](https://github.com/your-org/docsphere/issues)
3. **创建讨论**: [GitHub Discussions](https://github.com/your-org/docsphere/discussions)
4. **联系团队**: contributors@docsphere.com

## 📜 行为准则

为了营造友好和包容的社区环境，我们要求所有贡献者遵守我们的[行为准则](./CODE_OF_CONDUCT.md)。

### 核心原则

- **尊重**: 尊重不同的观点和经验
- **包容**: 接纳和包容所有参与者
- **友好**: 使用友好和包容的语言
- **建设**: 专注于对社区最有利的事情

---

感谢您为 DocSphere 项目的贡献！每一个贡献都让项目变得更好。🎉