import React, { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Input,
  Select,
  Card,
  Typography,
  Modal,
  message,
  Dropdown,
  Menu,
  Divider,
  Empty,
} from 'antd'
import {
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ShareAltOutlined,
  EditOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
  FileOutlined,
  FolderOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { FileService } from '@services/fileService'
import type { File as FileType, Folder } from '@types/index'
import { formatDateTime, formatFileSize, getFileType, getColorByType } from '@utils/index'
import FilePreview from './FilePreview'

const { Text } = Typography
const { Search } = Input

interface FileListProps {
  folderId?: number
  viewMode?: 'list' | 'grid'
  onFileSelect?: (file: FileType) => void
  onFolderSelect?: (folder: Folder) => void
  onRefresh?: () => void
}

interface FileItem extends FileType {
  key: number
}

const FileList: React.FC<FileListProps> = ({
  folderId,
  viewMode = 'list',
  onFileSelect,
  onFolderSelect,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [previewVisible, setPreviewVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null)

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        folderId,
        search: searchText || undefined,
        mimeType: filterType || undefined,
        sortBy,
        sortOrder: sortOrder.toUpperCase() as 'ASC' | 'DESC',
        page: pagination.current,
        pageSize: pagination.pageSize,
      }

      const response = await FileService.getFiles(params)
      const fileItems = response.data.items.map(file => ({
        ...file,
        key: file.id,
      }))

      setFiles(fileItems)
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
      }))
    } catch (error) {
      console.error('加载文件列表失败:', error)
      message.error('加载文件列表失败')
    } finally {
      setLoading(false)
    }
  }, [folderId, searchText, filterType, sortBy, sortOrder, pagination.current, pagination.pageSize])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // 文件操作
  const handleDownload = async (file: FileItem) => {
    try {
      await FileService.downloadFile(file.id, file.originalName)
      message.success(`${file.originalName} 下载成功`)
    } catch (error) {
      console.error('下载失败:', error)
      message.error('下载失败')
    }
  }

  const handleDelete = async (file: FileItem) => {
    try {
      await FileService.deleteFile(file.id)
      message.success(`${file.originalName} 删除成功`)
      loadFiles()
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const handlePreview = (file: FileItem) => {
    setSelectedFile(file)
    setPreviewVisible(true)
    onFileSelect?.(file)
  }

  const handlePreviewClose = () => {
    setPreviewVisible(false)
    setSelectedFile(null)
  }

  const handleShare = (file: FileItem) => {
    // TODO: 实现文件分享功能
    Modal.info({
      title: '文件分享',
      content: '文件分享功能正在开发中...',
    })
  }

  // 批量操作
  const handleBatchDelete = async () => {
    if (selectedFiles.length === 0) {
      message.warning('请选择要删除的文件')
      return
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedFiles.length} 个文件吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          // 批量删除
          await Promise.all(selectedFiles.map(id => FileService.deleteFile(id)))
          message.success(`成功删除 ${selectedFiles.length} 个文件`)
          setSelectedFiles([])
          loadFiles()
        } catch (error) {
          console.error('批量删除失败:', error)
          message.error('删除失败')
        }
      },
    })
  }

  // 表格列定义
  const columns: ColumnsType<FileItem> = [
    {
      title: '文件名',
      dataIndex: 'originalName',
      key: 'originalName',
      ellipsis: true,
      render: (text, record) => (
        <Space>
          <FileOutlined style={{ color: getColorByType(getFileType(record.mimeType)) }} />
          <Tooltip title={text}>
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => handlePreview(record)}
            >
              {text}
            </span>
          </Tooltip>
        </Space>
      ),
      sorter: true,
    },
    {
      title: '文件类型',
      dataIndex: 'mimeType',
      key: 'mimeType',
      width: 120,
      render: (mimeType) => {
        const type = getFileType(mimeType)
        return <Tag color={getColorByType(type)}>{type}</Tag>
      },
      filters: [
        { text: '图片', value: 'image' },
        { text: '视频', value: 'video' },
        { text: '音频', value: 'audio' },
        { text: '文档', value: 'document' },
        { text: '压缩包', value: 'archive' },
        { text: '其他', value: 'other' },
      ],
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size) => formatFileSize(size),
      sorter: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => formatDateTime(date),
      sorter: true,
    },
    {
      title: '下载次数',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      width: 120,
      render: (count) => count || 0,
      sorter: true,
    },
    {
      title: '可见性',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 100,
      render: (isPublic) => (
        <Tag color={isPublic ? 'green' : 'blue'}>
          {isPublic ? '公开' : '私有'}
        </Tag>
      ),
      filters: [
        { text: '公开', value: true },
        { text: '私有', value: false },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Tooltip title="分享">
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              onClick={() => handleShare(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: '编辑信息',
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除',
                  danger: true,
                },
              ],
              onClick: ({ key }) => {
                if (key === 'delete') {
                  Modal.confirm({
                    title: '确认删除',
                    content: `确定要删除文件 ${record.originalName} 吗？`,
                    onOk: () => handleDelete(record),
                  })
                }
              },
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ]

  // 表格配置
  const rowSelection = {
    selectedRowKeys: selectedFiles,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedFiles(selectedRowKeys as number[])
    },
  }

  // 处理表格变化
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setPagination(pagination)
    if (sorter.field) {
      setSortBy(sorter.field)
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc')
    }
  }

  // 搜索和筛选
  const handleSearch = (value: string) => {
    setSearchText(value)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleFilterChange = (value: string) => {
    setFilterType(value)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleSortOrderChange = (value: 'asc' | 'desc') => {
    setSortOrder(value)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  return (
    <>
      <Card
        title={
          <Space>
            <FolderOutlined />
            <span>文件列表</span>
          </Space>
        }
        extra={
          <Space>
            {/* 搜索 */}
            <Search
              placeholder="搜索文件"
              allowClear
              style={{ width: 200 }}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
            />

            {/* 筛选 */}
            <Select
              placeholder="文件类型"
              allowClear
              style={{ width: 120 }}
              onChange={handleFilterChange}
              options={[
                { label: '图片', value: 'image' },
                { label: '视频', value: 'video' },
                { label: '音频', value: 'audio' },
                { label: '文档', value: 'document' },
                { label: '压缩包', value: 'archive' },
              ]}
            />

            {/* 排序 */}
            <Select
              placeholder="排序方式"
              style={{ width: 120 }}
              value={sortBy}
              onChange={handleSortChange}
              options={[
                { label: '创建时间', value: 'createdAt' },
                { label: '文件名', value: 'originalName' },
                { label: '文件大小', value: 'size' },
                { label: '下载次数', value: 'downloadCount' },
              ]}
            />

            <Select
              style={{ width: 80 }}
              value={sortOrder}
              onChange={handleSortOrderChange}
              options={[
                { label: '升序', value: 'asc' },
                { label: '降序', value: 'desc' },
              ]}
            />

            {/* 操作按钮 */}
            {onRefresh && (
              <Button icon={<ReloadOutlined />} onClick={onRefresh}>
                刷新
              </Button>
            )}

            {selectedFiles.length > 0 && (
              <Popconfirm
                title="确认删除"
                description={`确定要删除选中的 ${selectedFiles.length} 个文件吗？`}
                onConfirm={handleBatchDelete}
              >
                <Button danger icon={<DeleteOutlined />}>
                  批量删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        {files.length === 0 ? (
          <Empty
            description="暂无文件"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={files}
            loading={loading}
            rowSelection={rowSelection}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
            onChange={handleTableChange}
            rowKey="id"
          />
        )}
      </Card>

      {/* 文件预览组件 */}
      <FilePreview
        visible={previewVisible}
        file={selectedFile}
        onClose={handlePreviewClose}
      />
    </>
  )
}

export default FileList