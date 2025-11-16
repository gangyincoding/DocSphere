# 前端组件开发指南

本文档详细说明了 DocSphere 前端组件的开发规范、最佳实践和设计模式，确保团队协作的代码质量和一致性。

## 组件架构设计

### 组件分层

```
components/
├── base/               # 基础组件（无业务逻辑）
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   └── Loading/
├── business/           # 业务组件（包含业务逻辑）
│   ├── FileUpload/
│   ├── FileList/
│   ├── PermissionModal/
│   └── UserSelector/
├── layout/            # 布局组件
│   ├── Header/
│   ├── Sidebar/
│   └── Footer/
└── pages/             # 页面组件（路由组件）
    ├── Dashboard/
    ├── FileManager/
    └── AdminPanel/
```

### 组件设计原则

1. **单一职责**: 每个组件只负责一个功能
2. **可复用性**: 组件应该可以在不同场景下复用
3. **可测试性**: 组件应该易于测试
4. **可维护性**: 组件代码应该清晰易懂

## 组件开发规范

### TypeScript 类型定义

#### Props 类型定义
```typescript
// components/business/FileUpload/types.ts
export interface FileUploadProps {
  /** 是否支持多文件上传 */
  multiple?: boolean;
  /** 接受的文件类型 */
  accept?: string[];
  /** 文件大小限制（字节） */
  maxSize?: number;
  /** 上传路径 */
  uploadPath?: string;
  /** 上传前的钩子 */
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  /** 上传成功的回调 */
  onSuccess?: (files: UploadedFile[]) => void;
  /** 上传失败的回调 */
  onError?: (error: UploadError) => void;
  /** 进度变化的回调 */
  onProgress?: (progress: UploadProgress) => void;
  /** 样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 子组件 */
  children?: React.ReactNode;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface UploadProgress {
  file: File;
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadError {
  file: File;
  error: Error;
}
```

#### State 类型定义
```typescript
// components/business/FileUpload/hooks/useFileUploadState.ts
export interface FileUploadState {
  files: File[];
  uploadingFiles: UploadingFile[];
  completedFiles: UploadedFile[];
  errors: UploadError[];
  isUploading: boolean;
  dragOver: boolean;
}

export interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: Error;
}
```

### 组件结构

#### 基本组件结构
```typescript
// components/business/FileUpload/index.tsx
import React, { useCallback, useState, useRef } from 'react';
import { Upload, message, Progress } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

import { FileUploadProps } from './types';
import { useFileUpload } from './hooks/useFileUpload';
import { FilePreview } from './FilePreview';
import { UploadProgress } from './UploadProgress';
import './styles.less';

const { Dragger } = Upload;

/**
 * 文件上传组件
 * @param props 组件属性
 * @returns JSX.Element
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  multiple = false,
  accept = ['*/*'],
  maxSize = 2 * 1024 * 1024 * 1024, // 2GB
  uploadPath = '/api/files/upload',
  beforeUpload,
  onSuccess,
  onError,
  onProgress,
  className,
  style,
  children
}) => {
  const {
    files,
    uploadingFiles,
    completedFiles,
    errors,
    isUploading,
    dragOver,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    retryUpload
  } = useFileUpload({
    maxSize,
    accept,
    uploadPath,
    beforeUpload,
    onSuccess,
    onError,
    onProgress
  });

  const uploadProps: UploadProps = {
    name: 'file',
    multiple,
    directory: false,
    showUploadList: false,
    beforeUpload: handleFileSelect,
    customRequest: () => {}, // 自定义上传逻辑
    onChange: () => {}, // 防止默认行为
    onDrop: handleDrop
  };

  return (
    <div
      className={`file-upload ${dragOver ? 'drag-over' : ''} ${className || ''}`}
      style={style}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Dragger {...uploadProps}>
        {children || (
          <div className="upload-area">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              点击或拖拽文件到此区域上传
            </p>
            <p className="ant-upload-hint">
              支持单个或批量上传，{multiple ? '支持文件夹上传' : '单文件上传'}，
              最大文件大小 {formatFileSize(maxSize)}
            </p>
          </div>
        )}
      </Dragger>

      {/* 上传进度 */}
      {uploadingFiles.length > 0 && (
        <UploadProgress
          files={uploadingFiles}
          onRetry={retryUpload}
          onRemove={removeFile}
        />
      )}

      {/* 已完成文件 */}
      {completedFiles.length > 0 && (
        <FilePreview
          files={completedFiles}
          onRemove={removeFile}
        />
      )}

      {/* 错误信息 */}
      {errors.length > 0 && (
        <div className="upload-errors">
          {errors.map((error, index) => (
            <div key={index} className="error-item">
              <span>{error.file.name}: {error.error.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

FileUpload.displayName = 'FileUpload';
```

#### 自定义 Hook
```typescript
// components/business/FileUpload/hooks/useFileUpload.ts
import { useState, useCallback } from 'react';
import { message } from 'antd';
import type { FileUploadProps } from '../types';
import { validateFile, formatFileSize } from '../utils/fileHelper';
import { uploadFile } from '../../../services/fileService';

export const useFileUpload = ({
  maxSize,
  accept,
  uploadPath,
  beforeUpload,
  onSuccess,
  onError,
  onProgress
}: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [completedFiles, setCompletedFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback(async (file: File, fileList: File[]) => {
    // 验证文件
    const validation = validateFile(file, { maxSize, accept });
    if (!validation.valid) {
      onError?.({
        file,
        error: new Error(validation.message)
      });
      return false;
    }

    // 执行上传前钩子
    if (beforeUpload) {
      const result = await beforeUpload(file);
      if (!result) {
        return false;
      }
    }

    // 添加到文件列表
    setFiles(prev => [...prev, file]);

    // 开始上传
    uploadSingleFile(file);

    return false; // 阻止默认上传行为
  }, [maxSize, accept, beforeUpload, onError]);

  const uploadSingleFile = useCallback(async (file: File) => {
    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      status: 'uploading'
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);
    setIsUploading(true);

    try {
      const result = await uploadFile(file, uploadPath, {
        onProgress: (loaded, total) => {
          const progress = Math.round((loaded / total) * 100);
          setUploadingFiles(prev =>
            prev.map(f =>
              f.file === file
                ? { ...f, progress, status: 'uploading' }
                : f
            )
          );
          onProgress?.({ file, loaded, total, percentage: progress });
        }
      });

      // 上传成功
      setUploadingFiles(prev =>
        prev.map(f =>
          f.file === file
            ? { ...f, status: 'success', progress: 100 }
            : f
        )
      );

      setCompletedFiles(prev => [...prev, result]);
      onSuccess?.([result]);

      // 从上传列表中移除
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.file !== file));
      }, 1000);

    } catch (error) {
      // 上传失败
      setUploadingFiles(prev =>
        prev.map(f =>
          f.file === file
            ? { ...f, status: 'error', error: error as Error }
            : f
        )
      );

      const uploadError: UploadError = {
        file,
        error: error as Error
      };

      setErrors(prev => [...prev, uploadError]);
      onError?.(uploadError);
      message.error(`文件 ${file.name} 上传失败`);
    } finally {
      setIsUploading(false);
    }
  }, [uploadPath, onProgress, onSuccess, onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => handleFileSelect(file, []));
  }, [handleFileSelect]);

  const removeFile = useCallback((file: File) => {
    setFiles(prev => prev.filter(f => f !== file));
    setUploadingFiles(prev => prev.filter(f => f.file !== file));
    setCompletedFiles(prev => prev.filter(f => f.name !== file.name));
    setErrors(prev => prev.filter(e => e.file !== file));
  }, []);

  const retryUpload = useCallback((file: File) => {
    uploadSingleFile(file);
  }, [uploadSingleFile]);

  return {
    files,
    uploadingFiles,
    completedFiles,
    errors,
    isUploading,
    dragOver,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    retryUpload
  };
};
```

#### 样式文件
```less
// components/business/FileUpload/styles.less
@import '../../../styles/variables.less';

.file-upload {
  .upload-area {
    padding: @padding-lg;
    text-align: center;
    border: 2px dashed @border-color-base;
    border-radius: @border-radius-base;
    background-color: @background-color-light;
    transition: all @animation-duration-slow;

    &:hover {
      border-color: @primary-color;
      background-color: fade(@primary-color, 2%);
    }

    .ant-upload-drag-icon {
      color: @primary-color;
      font-size: 48px;
      margin-bottom: @margin-md;
    }

    .ant-upload-text {
      font-size: @font-size-lg;
      color: @text-color;
      margin-bottom: @margin-sm;
    }

    .ant-upload-hint {
      color: @text-color-secondary;
      font-size: @font-size-base;
    }
  }

  &.drag-over {
    .upload-area {
      border-color: @primary-color;
      background-color: fade(@primary-color, 5%);
      transform: scale(1.02);
    }
  }

  .upload-progress {
    margin-top: @margin-md;
  }

  .upload-errors {
    margin-top: @margin-md;

    .error-item {
      padding: @padding-xs @padding-sm;
      background-color: fade(@error-color, 10%);
      border-left: 3px solid @error-color;
      color: @error-color;
      font-size: @font-size-sm;
      margin-bottom: @margin-xs;
      border-radius: @border-radius-sm;
    }
  }
}

// 响应式设计
@media (max-width: @screen-sm) {
  .file-upload {
    .upload-area {
      padding: @padding-md;

      .ant-upload-drag-icon {
        font-size: 36px;
      }

      .ant-upload-text {
        font-size: @font-size-base;
      }
    }
  }
}
```

### 组件工具函数

```typescript
// components/business/FileUpload/utils/fileHelper.ts
export interface FileValidationOptions {
  maxSize?: number;
  accept?: string[];
  maxFiles?: number;
}

export interface FileValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * 验证文件
 */
export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult => {
  const { maxSize = 2 * 1024 * 1024 * 1024, accept = ['*/*'] } = options;

  // 检查文件大小
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `文件大小不能超过 ${formatFileSize(maxSize)}`
    };
  }

  // 检查文件类型
  if (!accept.includes('*/*')) {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const validExtensions = accept
      .filter(type => type.startsWith('.'))
      .map(type => type.toLowerCase());

    if (validExtensions.length > 0 && !validExtensions.includes(fileExtension)) {
      return {
        valid: false,
        message: `不支持的文件类型，仅支持: ${validExtensions.join(', ')}`
      };
    }
  }

  return { valid: true };
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 获取文件图标
 */
export const getFileIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    // 图片
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    webp: 'image',
    svg: 'image',

    // 文档
    pdf: 'pdf',
    doc: 'word',
    docx: 'word',
    xls: 'excel',
    xlsx: 'excel',
    ppt: 'ppt',
    pptx: 'ppt',
    txt: 'text',
    md: 'markdown',

    // 视频
    mp4: 'video',
    avi: 'video',
    mov: 'video',
    wmv: 'video',
    flv: 'video',
    webm: 'video',

    // 音频
    mp3: 'audio',
    wav: 'audio',
    flac: 'audio',
    aac: 'audio',

    // 压缩文件
    zip: 'zip',
    rar: 'zip',
    '7z': 'zip',
    tar: 'zip',
    gz: 'zip',

    // 代码
    js: 'code',
    ts: 'code',
    jsx: 'code',
    tsx: 'code',
    html: 'code',
    css: 'code',
    json: 'code',
    xml: 'code',
    py: 'code',
    java: 'code',
    cpp: 'code',
    c: 'code'
  };

  return iconMap[extension || ''] || 'file';
};
```

## 组件测试

### 单元测试
```typescript
// components/business/FileUpload/__tests__/FileUpload.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from '../index';
import * as fileService from '../../../../services/fileService';
import { flushPromises } from '../../../../../test/utils';

// Mock 文件服务
jest.mock('../../../../services/fileService');
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

  it('renders correctly', () => {
    render(<FileUpload {...defaultProps} />);

    expect(screen.getByText(/点击或拖拽文件到此区域上传/)).toBeInTheDocument();
  });

  it('handles file selection', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    render(<FileUpload {...defaultProps} />);

    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [file] }
    });

    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledWith(
        file,
        '/api/files/upload',
        expect.any(Object)
      );
    });
  });

  it('validates file size', async () => {
    const largeFile = new File(['a'.repeat(3 * 1024 * 1024 * 1024)], 'large.txt', {
      type: 'text/plain'
    });

    render(
      <FileUpload
        {...defaultProps}
        maxSize={2 * 1024 * 1024 * 1024} // 2GB
      />
    );

    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [largeFile] }
    });

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

  it('shows upload progress', async () => {
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

    fireEvent.change(input, {
      target: { files: [file] }
    });

    await flushPromises();

    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
```

### 集成测试
```typescript
// components/business/FileUpload/__tests__/FileUpload.integration.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FileUpload } from '../index';
import { fileSlice } from '../../../../store/slices/fileSlice';

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

describe('FileUpload Integration', () => {
  it('integrates with Redux store', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    renderWithProviders(<FileUpload />);

    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [file] }
    });

    await waitFor(() => {
      // 验证 Redux 状态更新
      expect(store.getState().file.files).toContainEqual(
        expect.objectContaining({
          name: 'test.txt'
        })
      );
    });
  });
});
```

## 组件文档

### 组件故事（Storybook）
```typescript
// components/business/FileUpload/FileUpload.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { FileUpload } from './index';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof FileUpload> = {
  title: 'Components/FileUpload',
  component: FileUpload,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '文件上传组件，支持拖拽上传、批量上传、进度显示等功能。'
      }
    }
  },
  argTypes: {
    multiple: {
      control: 'boolean',
      description: '是否支持多文件上传'
    },
    maxSize: {
      control: 'number',
      description: '文件大小限制（字节）'
    },
    accept: {
      control: 'array',
      description: '接受的文件类型'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSuccess: action('onSuccess'),
    onError: action('onError'),
    onProgress: action('onProgress')
  }
};

export const MultipleFiles: Story = {
  args: {
    multiple: true,
    accept: ['.jpg', '.png', '.pdf'],
    onSuccess: action('onSuccess'),
    onError: action('onError')
  }
};

export const CustomContent: Story = {
  args: {
    children: (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h3>自定义上传区域</h3>
        <p>拖拽文件到这里上传</p>
      </div>
    ),
    onSuccess: action('onSuccess'),
    onError: action('onError')
  }
};
```

## 性能优化

### 组件懒加载
```typescript
// 使用 React.lazy 进行代码分割
const FileUpload = React.lazy(() => import('./FileUpload'));

// 使用 Suspense 包装
<Suspense fallback={<Loading />}>
  <FileUpload />
</Suspense>
```

### 虚拟化列表
```typescript
// 对于大量文件列表，使用虚拟滚动
import { FixedSizeList as List } from 'react-window';

const FileList: React.FC<{ files: File[] }> = ({ files }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <FileItem file={files[index]} />
    </div>
  );

  return (
    <List
      height={400}
      itemCount={files.length}
      itemSize={60}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 防抖和节流
```typescript
// 对频繁触发的事件进行防抖处理
import { useDebouncedCallback } from 'use-debounce';

const Component = () => {
  const handleSearch = useDebouncedCallback(
    (value: string) => {
      // 搜索逻辑
    },
    300
  );

  return (
    <Input onChange={(e) => handleSearch(e.target.value)} />
  );
};
```

## 最佳实践总结

### 代码规范
1. **命名规范**
   - 组件名使用 PascalCase
   - 文件名与组件名保持一致
   - Props 使用 camelCase
   - 事件处理函数以 handle 开头

2. **类型安全**
   - 所有 Props 都必须有类型定义
   - 使用 TypeScript 而不是 PropTypes
   - 避免使用 any 类型

3. **性能优化**
   - 使用 useCallback 和 useMemo 优化渲染
   - 合理使用 React.memo
   - 避免在 render 中创建函数

4. **可访问性**
   - 提供适当的 ARIA 属性
   - 支持键盘导航
   - 提供足够的颜色对比度

5. **测试覆盖**
   - 单元测试覆盖率 > 80%
   - 包含集成测试
   - 测试重要的用户交互场景

---

💡 **提示**: 在开发新组件时，参考现有的组件模式和最佳实践，保持代码风格的一致性。