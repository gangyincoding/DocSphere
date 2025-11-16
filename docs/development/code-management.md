# DocSphere 代码管理规范文档

## 概述

本文档定义了 DocSphere 项目的代码管理标准、提交规范和版本控制策略，确保代码质量、协作效率和版本可追溯性。

## 🎯 **核心原则**

### 1. **质量优先原则**
- ❌ 不允许提交无法运行的代码
- ✅ 所有代码必须通过测试验证
- ✅ 所有代码必须符合代码规范
- ✅ 所有功能必须有对应的文档

### 2. **小步快跑原则**
- ✅ 功能完成后立即提交
- ✅ 避免大量代码积压
- ✅ 保持提交记录的可读性
- ✅ 每次提交都是可工作的状态

### 3. **测试驱动原则**
- ✅ 先测试后开发（TDD）
- ✅ 功能完成立即测试
- ✅ 测试覆盖率必须达标
- ✅ 自动化CI/CD验证

## 📋 **提交时机规范**

### **必须立即提交的情况**

#### **1. 功能模块完成时**
当一个完整的功能模块开发完成时，必须立即提交：
```
✅ 功能开发完成
✅ 单元测试编写完成
✅ 集成测试通过
✅ 代码审查通过
→ 立即提交代码
```

**示例场景：**
- ✅ 用户认证系统完成 + 测试通过
- ✅ 权限控制系统完成 + 测试通过
- ✅ 文件管理系统完成 + 测试通过

#### **2. 重大缺陷修复时**
当修复了影响系统稳定性的重大缺陷时：
```
✅ 问题已复现和修复
✅ 修复已验证
✅ 回归测试通过
→ 立即提交代码
```

#### **3. 安全漏洞修复时**
当发现并修复了安全漏洞时：
```
✅ 漏洞已验证
✅ 修复已测试
✅ 安全测试通过
→ 立即提交代码
```

### **建议定期提交的情况**

#### **1. 每日结束时**
- 🔄 **推荐**：每日工作结束前提交当天成果
- 📝 **记录**：当日完成的功能和修复的问题
- 🏷 **规范**：清晰的提交信息

#### **2. 里程碑节点时**
- 🔄 **推荐**：达到项目里程碑时提交
- 📝 **记录**：里程碑达成情况
- 🏷 **规范**：版本标签

#### **3. 发布前准备时**
- 🔄 **推荐**：版本发布前提交最终代码
- 📝 **记录**：版本变更内容
- 🏷 **规范**：版本号管理

## 🚀 **提交工作流程**

### **标准提交流程**
```
1. 开发功能
2. 编写测试
3. 本地测试通过
4. 代码自检
5. 运行完整测试套件
6. 提交代码
7. 推送代码
8. 等待CI/CD
```

### **强制检查项**
每个提交前必须确认：
- [ ] **代码运行正常**：可以正常启动和运行
- [ ] **测试全部通过**：单元测试、集成测试、E2E测试
- [ ] **代码规范检查**：ESLint、Prettier格式化
- [ ] **功能验证**：手动验证核心功能
- [ ] **文档更新**：相关文档已更新
- [ ] **无敏感信息**：无密码、密钥、个人信息

### **自动验证工具**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint-staged && npm run test:unit && npm run type-check",
      "pre-push": "npm run test:ci && npm run security-check",
      "commit-msg": "npm run commitlint"
    }
  }
}
```

## 📝 **提交信息规范**

### **提交消息格式**
采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

#### **提交类型 (type)**
- `feat`: 新功能
- `fix`: 修复缺陷
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建工具、依赖更新等
- `perf`: 性能优化
- `ci`: CI/CD相关
- `revert`: 回滚提交

#### **影响范围 (scope)**
- `auth`: 认证相关
- `permission`: 权限相关
- `file`: 文件管理
- `folder`: 文件夹管理
- `share`: 分享功能
- `api`: API接口
- `db`: 数据库相关
- `config`: 配置相关
- `docs`: 文档
- `test`: 测试

#### **提交消息模板**

**功能开发：**
```bash
feat(auth): 实现JWT token刷新机制

- 添加refreshToken接口
- 支持token自动续期
- 更新中间件处理逻辑

🚀 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

**缺陷修复：**
```bash
fix(file): 修复大文件上传内存溢出问题

- 优化文件分块上传
- 增加上传进度显示
- 添加文件大小验证

🚀 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

**文档更新：**
```bash
docs(api): 更新API文档

- 添加文件上传接口文档
- 更新权限相关接口说明
- 补充错误响应示例

🚀 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### **详细要求**

#### **Subject（主题）**
- 使用祈使句，简明扼要
- 首字母小写
- 不超过50个字符
- 准确描述变更内容

**好的示例：**
```
✅ "实现用户注册功能"
✅ "修复文件下载权限问题"
✅ "更新API文档结构"
✅ "重构权限检查中间件"
```

**坏的示例：**
```
❌ "完成用户功能"
❌ "修复bug"
❌ "更新代码"
❌ "提交代码"
```

#### **Body（正文）**
- 详细说明变更内容和原因
- 包含技术实现细节（如适用）
- 说明影响范围和影响
- 提供相关Issue或PR链接（如适用）

**结构要求：**
- 空行分隔subject和body
- 换行缩进
- 每行不超过72字符

#### **Footer（页脚）**
- 可选，通常包含工具信息
- 格式：`🚀 Generated with [Tool Name]`
- 协作者信息

## 🏷 **分支管理策略**

### **分支结构**
```
main (生产环境)
├── develop (开发环境)
│   ├── feature/auth-system (功能开发)
│   ├── feature/file-management (功能开发)
│   ├── feature/permission-system (功能开发)
│   └── hotfix/security-patch (紧急修复)
├── release/v1.0.0 (版本发布)
└── release/v1.0.1 (补丁版本)
```

### **分支用途说明**

#### **主分支 (main)**
- ✅ 生产环境代码
- ✅ 稳定可靠
- ✅ 受保护，需PR合并
- ✅ 自动部署触发

#### **开发分支 (develop)**
- ✅ 集成测试环境
- ✅ 功能集成验证
- ✅ 主分支的前置分支

#### **功能分支 (feature/*)**
- ✅ 单个功能开发
- ✅ 独立开发环境
- ✅ 开发完成后合并到develop

#### **修复分支 (hotfix/*)**
- ✅ 紧急问题修复
- ✅ 快速修复，最小影响
- ✅ 修复后立即合并到main和develop

#### **发布分支 (release/*)**
- ✅ 版本发布准备
- ✅ 测试和验证
- ✅ 标签创建完成后合并到main

### **分支操作规范**

#### **创建分支**
```bash
# 创建功能分支
git checkout develop
git checkout -b feature/user-authentication

# 创建修复分支
git checkout main
git checkout -b hotfix/security-patch

# 创建发布分支
git checkout main
git checkout -b release/v1.0.0
```

#### **分支合并**
```bash
# 功能分支合并到开发分支
git checkout develop
git merge feature/user-authentication
git push origin develop

# 开发分支合并到主分支
git checkout main
git merge develop
git push origin main

# 修复分支直接合并
git checkout main
git merge hotfix/security-patch
git push origin main
git tag v1.0.1
git push origin v1.0.1
```

#### **分支删除**
```bash
# 合并后删除功能分支
git branch -d feature/user-authentication
git push origin --delete feature/user-authentication

# 合并后删除修复分支
git branch -d hotfix/security-patch
git push origin --delete hotfix/security-patch
```

## 🔖 **版本控制策略**

### **版本号规范**
采用 [语义化版本控制](https://semver.org/)：

#### **版本格式**
```
主版本号.次版本号.修订号

示例：
- 1.0.0 - 初始版本
- 1.1.0 - 新功能版本
- 1.1.1 - 修复版本
- 2.0.0 - 重大更新版本
```

#### **版本类型说明**
- **主版本号（Major）**：不兼容的API变更
- **次版本号（Minor）**：向后兼容的功能性新增
- **修订号（Patch）**：向后兼容的问题修正

### **版本发布流程**
1. **开发完成** → 2. **合并到develop** → 3. **集成测试** → 4. **创建release分支** → 5. **测试验证** → 6. **合并到main** → 7. **创建标签** → 8. **发布部署**

### **标签管理**
```bash
# 创建轻量级标签
git tag v1.0.0

# 创建带注释的标签
git tag -a v1.0.0 -m "初始版本发布"

# 推送标签到远程
git push origin v1.0.0

# 推送所有标签
git push origin --tags
```

## 🔧 **代码质量保证**

### **自动化检查**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint:staged && npm run test:unit && npm run type-check",
      "pre-push": "npm run test:ci && npm run security-check",
      "commit-msg": "npm run commitlint"
    }
  },
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

### **手动检查清单**

#### **代码提交前检查：**
- [ ] 代码语法正确，无语法错误
- [ ] TypeScript类型检查通过
- [ ] ESLint规则检查通过
- [ ] Prettier格式化完成
- [ ] 单元测试全部通过
- [ ] 集成测试相关通过
- [ ] 功能验证正常

#### **代码审查检查：**
- [ ] 逻辑实现正确性
- [ ] 代码风格一致性
- [ ] 性能考虑充分
- [ ] 安全性验证完整
- [ ] 错误处理全面
- [ ] 文档更新及时
- [ ] 测试覆盖充足

#### **部署前检查：**
- [ ] 所有测试通过
- [ ] 构建成功
- [ ] 环境变量正确配置
- [ ] 数据库迁移正常
- [ ] 安全检查通过

## 📊 **监控和报告**

### **提交统计分析**
- **提交频率**：每日/每周提交次数
- **代码质量**：通过率、错误率
- **测试覆盖率**：覆盖率和趋势
- **合并时间**：PR合并平均时间

### **质量指标**
- **代码覆盖率**：单元测试覆盖率 ≥ 80%
- **集成测试通过率**：≥ 95%
- **代码审查通过率**：≥ 90%
- **构建成功率**：≥ 95%
- **部署成功率**：≥ 98%

### **违规处理**
- **轻微违规**：口头警告，及时修正
- **重复违规**：书面警告，记录文档
- **严重违规**：权限限制，强制培训

## 🔗 **团队协作规范**

### **代码审查**
- **审查人员**：至少一名资深开发者审查
- **审查时间**：24小时内响应
- **审查重点**：逻辑正确性、性能、安全性、可维护性
- **审查记录**：所有审查记录必须保存

### **冲突解决**
- **优先级**：主分支 > 开发分支 > 功能分支
- **解决方法**：优先保留最新提交的更改
- **沟通协调**：必要时进行线下讨论

### **发布协调**
- **发布窗口**：业务低峰期（如周末凌晨）
- **回滚准备**：准备回滚方案
- **通知机制**：及时通知相关人员

## 📚 **相关文档链接**

- [测试规范文档](./testing-standards.md)
- [贡献指南](../guides/contributing.md)
- [部署指南](../guides/deployment.md)
- [API规范文档](../api/api-specification.md)

## 🔐 **更新维护**

### **文档维护**
- **定期更新**：每个版本发布后更新
- **版本同步**：确保文档与代码同步
- **问题修正**：及时修正发现的问题
- **使用反馈**：收集并处理用户反馈

### **版本记录**
- **v1.0.0** (2024-01-15): 初始版本创建
- **v1.1.0** (2024-01-16): 细化提交策略，添加质量保证
- **v1.2.0** (2024-01-16): 完善分支管理和版本控制

---

💡 **重要提醒**：**代码管理规范是团队协作的基础，所有成员都必须严格遵守。违反规范将影响团队效率和代码质量。**

**本规范自发布之日起生效，所有代码提交必须符合规范要求。**