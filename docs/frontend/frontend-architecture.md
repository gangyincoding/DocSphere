# 前端架构设计

## 架构概述

DocSphere 前端采用现代化的 React 技术栈，基于组件化和模块化的设计理念。架构设计注重可维护性、可扩展性和用户体验，采用分层架构模式，确保代码的清晰结构和职责分离。

## 技术栈详情

### 核心技术
- **React 18**: 采用最新的并发特性和Suspense
- **TypeScript 5.x**: 提供类型安全和更好的开发体验
- **Vite**: 快速的构建工具，支持热重载
- **React Router 6**: 现代化的路由管理

### 状态管理
- **Redux Toolkit**: 简化的Redux状态管理
- **RTK Query**: 数据获取和缓存解决方案
- **React Hook Form**: 表单状态管理

### UI组件库
- **Ant Design 5.x**: 企业级UI组件库
- **@ant-design/icons**: 图标库
- **@ant-design/pro-components**: 高级业务组件

### 工具和库
- **Axios**: HTTP客户端
- **react-dropzone**: 文件拖拽上传
- **@tanstack/react-query**: 服务端状态管理
- **dayjs**: 日期处理
- **lodash**: 工具函数库

## 项目结构

```
src/
├── components/              # 通用组件
│   ├── FileUpload/         # 文件上传组件
│   │   ├── index.tsx
│   │   ├── UploadArea.tsx
│   │   ├── ProgressBar.tsx
│   │   └── FilePreview.tsx
│   ├── FileList/           # 文件列表组件
│   │   ├── index.tsx
│   │   ├── FileItem.tsx
│   │   ├── FileIcon.tsx
│   │   └── FileActions.tsx
│   ├── FolderTree/         # 文件夹树组件
│   │   ├── index.tsx
│   │   ├── TreeNode.tsx
│   │   └── FolderActions.tsx
│   ├── PermissionModal/    # 权限设置模态框
│   │   ├── index.tsx
│   │   ├── UserSelector.tsx
│   │   └── PermissionForm.tsx
│   └── Common/             # 通用组件
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       ├── ConfirmModal.tsx
│       └── PageHeader.tsx
├── pages/                  # 页面组件
│   ├── Dashboard/          # 仪表板
│   │   ├── index.tsx
│   │   ├── Statistics.tsx
│   │   ├── RecentFiles.tsx
│   │   └── QuickActions.tsx
│   ├── FileManager/        # 文件管理
│   │   ├── index.tsx
│   │   ├── FileExplorer.tsx
│   │   ├── ToolBar.tsx
│   │   ├── SideBar.tsx
│   │   └── ContentView.tsx
│   ├── ShareCenter/        # 分享中心
│   │   ├── index.tsx
│   │   ├── ShareList.tsx
│   │   └── ShareSettings.tsx
│   ├── UserManagement/     # 用户管理
│   │   ├── index.tsx
│   │   ├── UserList.tsx
│   │   └── UserForm.tsx
│   └── AdminPanel/         # 管理后台
│       ├── index.tsx
│       ├── SystemMonitor.tsx
│       └── AuditLogs.tsx
├── hooks/                  # 自定义 Hooks
│   ├── useAuth.ts          # 认证相关
│   ├── useFile.ts          # 文件操作
│   ├── usePermission.ts    # 权限控制
│   ├── useUpload.ts        # 文件上传
│   ├── useSearch.ts        # 搜索功能
│   └── useLocalStorage.ts  # 本地存储
├── services/               # API 服务
│   ├── api.ts              # API 基础配置
│   ├── authService.ts      # 认证服务
│   ├── fileService.ts      # 文件服务
│   ├── userService.ts      # 用户服务
│   ├── permissionService.ts # 权限服务
│   └── shareService.ts     # 分享服务
├── store/                  # 状态管理
│   ├── index.ts            # Store配置
│   ├── slices/             # Redux Slices
│   │   ├── authSlice.ts    # 认证状态
│   │   ├── fileSlice.ts    # 文件状态
│   │   ├── uiSlice.ts      # UI状态
│   │   └── settingsSlice.ts # 设置状态
│   └── api/                # RTK Query API
│       ├── authApi.ts
│       ├── fileApi.ts
│       └── userApi.ts
├── utils/                  # 工具函数
│   ├── constants.ts        # 常量定义
│   ├── helpers.ts          # 辅助函数
│   ├── permission.ts       # 权限工具
│   ├── fileUtils.ts        # 文件工具
│   ├── validation.ts       # 表单验证
│   └── storage.ts          # 存储工具
├── styles/                 # 样式文件
│   ├── globals.css         # 全局样式
│   ├── variables.css       # CSS变量
│   ├── components.css      # 组件样式
│   └── themes/             # 主题样式
│       ├── light.css
│       └── dark.css
├── types/                  # TypeScript 类型定义
│   ├── api.ts              # API类型
│   ├── user.ts             # 用户类型
│   ├── file.ts             # 文件类型
│   ├── permission.ts       # 权限类型
│   └── common.ts           # 通用类型
├── assets/                 # 静态资源
│   ├── images/
│   ├── icons/
│   └── fonts/
└── config/                 # 配置文件
    ├── app.ts              # 应用配置
    ├── routes.ts           # 路由配置
    └── constants.ts        # 常量配置
```

## 核心组件设计

### 1. 文件管理组件

#### FileManager 主组件
```tsx
interface FileManagerProps {
  initialFolderId?: string;
  viewMode?: 'list' | 'grid';
}

const FileManager: React.FC<FileManagerProps> = ({
  initialFolderId,
  viewMode = 'list'
}) => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(viewMode);

  const {
    files,
    folders,
    loading,
    error,
    createFolder,
    uploadFiles,
    deleteItems,
    moveItems
  } = useFile(currentFolderId);

  const { checkPermission } = usePermission(currentFolderId, 'folder');

  return (
    <div className="file-manager">
      <ToolBar
        selectedCount={selectedItems.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onUpload={() => {/* 处理上传 */}}
        onNewFolder={() => {/* 创建文件夹 */}}
        onDelete={() => deleteItems(selectedItems)}
        canUpload={checkPermission('write')}
        canDelete={checkPermission('delete')}
      />

      <div className="content-area">
        <SideBar
          currentPath={currentPath}
          onPathChange={setCurrentPath}
        />

        <ContentView
          files={files}
          folders={folders}
          selectedItems={selectedItems}
          viewMode={viewMode}
          loading={loading}
          onSelect={setSelectedItems}
          onItemDoubleClick={handleItemDoubleClick}
        />
      </div>
    </div>
  );
};
```

#### FileItem 组件
```tsx
interface FileItemProps {
  file: FileInfo;
  selected: boolean;
  viewMode: 'list' | 'grid';
  onSelect: (id: string) => void;
  onPreview: (file: FileInfo) => void;
  onDownload: (file: FileInfo) => void;
  onDelete: (file: FileInfo) => void;
  permissions: string[];
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  selected,
  viewMode,
  onSelect,
  onPreview,
  onDownload,
  onDelete,
  permissions
}) => {
  const { formatFileSize, formatDate } = useFileUtils();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const actions = useMemo(() => [
    {
      key: 'preview',
      label: '预览',
      icon: <EyeOutlined />,
      disabled: !permissions.includes('read'),
      onClick: () => onPreview(file)
    },
    {
      key: 'download',
      label: '下载',
      icon: <DownloadOutlined />,
      disabled: !permissions.includes('read'),
      onClick: () => onDownload(file)
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      disabled: !permissions.includes('delete'),
      danger: true,
      onClick: () => onDelete(file)
    }
  ], [file, permissions]);

  return (
    <>
      <div
        className={`file-item ${selected ? 'selected' : ''} ${viewMode}`}
        onClick={() => onSelect(file.id)}
        onContextMenu={handleContextMenu}
      >
        <FileIcon mimeType={file.mimeType} size={viewMode === 'grid' ? 48 : 24} />
        <div className="file-info">
          <div className="file-name" title={file.name}>
            {file.name}
          </div>
          <div className="file-meta">
            <span>{formatFileSize(file.size)}</span>
            <span>{formatDate(file.uploadedAt)}</span>
          </div>
        </div>
      </div>

      <ContextMenu
        visible={!!contextMenu}
        position={contextMenu}
        actions={actions}
        onClose={() => setContextMenu(null)}
      />
    </>
  );
};
```

### 2. 文件上传组件

#### FileUpload 组件
```tsx
interface FileUploadProps {
  folderId?: string;
  multiple?: boolean;
  accept?: string[];
  maxSize?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  folderId,
  multiple = true,
  accept = ['*/*'],
  maxSize = 2 * 1024 * 1024 * 1024, // 2GB
  onUploadComplete,
  onUploadError
}) => {
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const { uploadFile, uploadProgress } = useUpload();

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => file.size <= maxSize);
    const invalidFiles = acceptedFiles.filter(file => file.size > maxSize);

    if (invalidFiles.length > 0) {
      message.error(`以下文件超过大小限制: ${invalidFiles.map(f => f.name).join(', ')}`);
    }

    const newTasks: UploadTask[] = validFiles.map(file => ({
      id: generateId(),
      file,
      status: 'pending',
      progress: 0,
      error: null
    }));

    setUploadQueue(prev => [...prev, ...newTasks]);
    processUploadQueue(newTasks);
  }, [maxSize]);

  const processUploadQueue = async (tasks: UploadTask[]) => {
    for (const task of tasks) {
      try {
        setUploadQueue(prev =>
          prev.map(t => t.id === task.id ? { ...t, status: 'uploading' } : t)
        );

        const uploadedFile = await uploadFile(task.file, folderId, {
          onProgress: (progress) => {
            setUploadQueue(prev =>
              prev.map(t => t.id === task.id ? { ...t, progress } : t)
            );
          }
        });

        setUploadQueue(prev =>
          prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t)
        );

        onUploadComplete?.([uploadedFile]);
      } catch (error) {
        setUploadQueue(prev =>
          prev.map(t => t.id === task.id ? {
            ...t,
            status: 'error',
            error: error as Error
          } : t)
        );
        onUploadError?.(error as Error);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple,
    accept: accept.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>)
  });

  return (
    <div className="file-upload">
      <div
        {...getRootProps()}
        className={`upload-area ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <CloudUploadOutlined className="upload-icon" />
        <p className="upload-text">
          {isDragActive ? '释放文件以上传' : '拖拽文件到此处或点击选择文件'}
        </p>
        <p className="upload-hint">
          支持批量上传，单个文件最大 {formatFileSize(maxSize)}
        </p>
      </div>

      {uploadQueue.length > 0 && (
        <div className="upload-queue">
          <h4>上传队列</h4>
          {uploadQueue.map(task => (
            <UploadTaskItem
              key={task.id}
              task={task}
              onCancel={() => {/* 取消上传 */}}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3. 权限管理组件

#### PermissionModal 组件
```tsx
interface PermissionModalProps {
  visible: boolean;
  resourceType: 'file' | 'folder';
  resourceId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  resourceType,
  resourceId,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const { grantPermission, revokePermission } = usePermission();
  const { searchUsers } = useUser();

  useEffect(() => {
    if (visible) {
      loadPermissions();
    }
  }, [visible, resourceId]);

  const loadPermissions = async () => {
    const data = await permissionService.getResourcePermissions(resourceType, resourceId);
    setPermissions(data);
  };

  const handleGrantPermission = async (values: any) => {
    try {
      await grantPermission({
        userId: values.userId,
        resourceType,
        resourceId,
        permissions: values.permissions,
        expiresIn: values.expiresIn
      });

      message.success('权限授予成功');
      form.resetFields();
      loadPermissions();
      onSuccess();
    } catch (error) {
      message.error('权限授予失败');
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    try {
      await revokePermission(permissionId);
      message.success('权限撤销成功');
      loadPermissions();
    } catch (error) {
      message.error('权限撤销失败');
    }
  };

  return (
    <Modal
      title="权限设置"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <div className="permission-modal">
        <div className="grant-permission">
          <h3>授予权限</h3>
          <Form
            form={form}
            layout="inline"
            onFinish={handleGrantPermission}
          >
            <Form.Item
              name="userId"
              rules={[{ required: true, message: '请选择用户' }]}
            >
              <UserSelector
                placeholder="选择用户"
                onSearch={searchUsers}
              />
            </Form.Item>

            <Form.Item
              name="permissions"
              rules={[{ required: true, message: '请选择权限' }]}
            >
              <Select
                mode="multiple"
                placeholder="选择权限"
                style={{ width: 200 }}
              >
                <Option value="read">读取</Option>
                <Option value="write">写入</Option>
                <Option value="delete">删除</Option>
                <Option value="share">分享</Option>
              </Select>
            </Form.Item>

            <Form.Item name="expiresIn">
              <Select placeholder="有效期" style={{ width: 120 }}>
                <Option value="1d">1天</Option>
                <Option value="7d">7天</Option>
                <Option value="30d">30天</Option>
                <Option value="never">永久</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                授予权限
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="permission-list">
          <h3>当前权限</h3>
          <List
            dataSource={permissions}
            renderItem={(permission) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    danger
                    onClick={() => handleRevokePermission(permission.id)}
                  >
                    撤销
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={permission.user.avatar} />}
                  title={permission.user.fullName}
                  description={
                    <div>
                      <Tag color="blue">{permission.user.role}</Tag>
                      {permission.permissions.map(p => (
                        <Tag key={p}>{p}</Tag>
                      ))}
                      {permission.expiresAt && (
                        <span className="expire-time">
                          到期: {formatDate(permission.expiresAt)}
                        </span>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    </Modal>
  );
};
```

## 自定义 Hooks

### useAuth Hook
```typescript
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, isLoading, isAuthenticated } = useAppSelector(state => state.auth);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch(authSlice.actions.setLoading(true));
      const response = await authService.login(credentials);
      const { user, token, refreshToken } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      dispatch(authSlice.actions.setAuth({ user, token }));

      return { success: true };
    } catch (error) {
      dispatch(authSlice.actions.setError(error as Error));
      return { success: false, error };
    } finally {
      dispatch(authSlice.actions.setLoading(false));
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch(authSlice.actions.clearAuth());
  }, [dispatch]);

  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        logout();
        return;
      }

      const response = await authService.refreshToken({ refreshToken });
      const { token: newToken, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      dispatch(authSlice.actions.setToken(newToken));
    } catch (error) {
      logout();
    }
  }, [dispatch, logout]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshToken
  };
};
```

### useFile Hook
```typescript
export const useFile = (folderId?: string) => {
  const dispatch = useAppDispatch();
  const { files, folders, currentFolder, loading, error } = useAppSelector(state => state.file);

  const loadFiles = useCallback(async (folderId: string) => {
    try {
      dispatch(fileSlice.actions.setLoading(true));
      const response = await fileService.getFiles({ folderId });
      dispatch(fileSlice.actions.setFiles(response.data));
    } catch (error) {
      dispatch(fileSlice.actions.setError(error as Error));
    } finally {
      dispatch(fileSlice.actions.setLoading(false));
    }
  }, [dispatch]);

  const uploadFiles = useCallback(async (files: File[], targetFolderId?: string) => {
    const uploadPromises = files.map(file =>
      fileService.uploadFile(file, targetFolderId || folderId)
    );

    try {
      const results = await Promise.all(uploadPromises);
      message.success(`成功上传 ${results.length} 个文件`);

      if (folderId) {
        loadFiles(folderId);
      }

      return results;
    } catch (error) {
      message.error('文件上传失败');
      throw error;
    }
  }, [folderId, loadFiles]);

  const deleteFiles = useCallback(async (fileIds: string[]) => {
    try {
      await fileService.deleteFiles(fileIds);
      message.success('文件删除成功');
      dispatch(fileSlice.actions.removeFiles(fileIds));
    } catch (error) {
      message.error('文件删除失败');
      throw error;
    }
  }, [dispatch]);

  useEffect(() => {
    if (folderId) {
      loadFiles(folderId);
    }
  }, [folderId, loadFiles]);

  return {
    files,
    folders,
    currentFolder,
    loading,
    error,
    loadFiles,
    uploadFiles,
    deleteFiles,
    refresh: () => folderId && loadFiles(folderId)
  };
};
```

## 状态管理架构

### Redux Store 配置
```typescript
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    file: fileSlice.reducer,
    ui: uiSlice.reducer,
    settings: settingsSlice.reducer,
    api: apiSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production'
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Auth Slice
```typescript
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  }
});
```

## 路由架构

### 路由配置
```typescript
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="files/*" element={<FileManager />} />
          <Route path="shares" element={<ShareCenter />} />

          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminPanel />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/settings" element={<SystemSettings />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
```

### 路由守卫
```typescript
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const AdminRoute: React.FC = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
```

## 主题和样式

### 主题配置
```typescript
export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    wireframe: false
  },
  components: {
    Layout: {
      headerBg: '#001529',
      siderBg: '#001529'
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17'
    }
  },
  algorithm: theme.defaultAlgorithm
};
```

### CSS 变量
```css
:root {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;

  --text-color: #262626;
  --text-color-secondary: #8c8c8c;
  --text-color-disabled: #bfbfbf;

  --border-color: #d9d9d9;
  --border-radius: 6px;

  --background-color: #ffffff;
  --background-color-light: #fafafa;

  --box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12);
}

[data-theme='dark'] {
  --text-color: #ffffff;
  --text-color-secondary: #a6a6a6;
  --background-color: #141414;
  --background-color-light: #1f1f1f;
  --border-color: #434343;
}
```

## 性能优化策略

### 代码分割
```typescript
const FileManager = lazy(() => import('../pages/FileManager'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const AdminPanel = lazy(() => import('../pages/AdminPanel'));

const App = () => (
  <Suspense fallback={<PageLoading />}>
    <Routes>
      <Route path="/files/*" element={<FileManager />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin/*" element={<AdminPanel />} />
    </Routes>
  </Suspense>
);
```

### 虚拟滚动
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualFileList: React.FC<{ files: FileInfo[] }> = ({ files }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <FileItem file={files[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={files.length}
      itemSize={60}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 缓存策略
```typescript
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['File', 'Folder', 'User', 'Permission'],
  endpoints: (builder) => ({
    getFiles: builder.query<FilesResponse, { folderId?: string }>({
      query: ({ folderId }) => ({
        url: '/files',
        params: { folderId }
      }),
      providesTags: ['File'],
      keepUnusedDataFor: 60
    })
  })
});
```

## 测试架构

### 组件测试
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { FileItem } from '../components/FileList';

const mockFile = {
  id: '1',
  name: 'test.pdf',
  size: 1024,
  mimeType: 'application/pdf'
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('FileItem', () => {
  it('renders file information correctly', () => {
    renderWithProvider(
      <FileItem
        file={mockFile}
        selected={false}
        onSelect={jest.fn()}
        onPreview={jest.fn()}
        onDownload={jest.fn()}
        onDelete={jest.fn()}
        permissions={['read']}
      />
    );

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    renderWithProvider(
      <FileItem
        file={mockFile}
        selected={false}
        onSelect={onSelect}
        onPreview={jest.fn()}
        onDownload={jest.fn()}
        onDelete={jest.fn()}
        permissions={['read']}
      />
    );

    fireEvent.click(screen.getByText('test.pdf'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

## 部署和构建

### Vite 配置
```typescript
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
          utils: ['lodash', 'dayjs']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
```

这套前端架构设计提供了完整的开发框架，确保代码的可维护性、可扩展性和高性能。通过模块化设计、类型安全、状态管理和性能优化，为用户提供了优秀的使用体验。