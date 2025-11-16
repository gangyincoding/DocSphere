import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Layout, Row, Col, Card, Typography, Breadcrumb, Statistic, Space } from 'antd'
import {
  FileOutlined,
  FolderOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import FileUpload from '@components/File/FileUpload'
import FileList from '@components/File/FileList'
import FolderTree from '@components/Folder/FolderTree'
import { FileService } from '@services/fileService'
import type { Folder } from '@types/index'

const { Header, Content, Sider } = Layout
const { Title } = Typography

const FileManagementPage: React.FC = () => {
  const { folderId } = useParams()
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)

  // 加载文件夹信息和统计数据
  useEffect(() => {
    if (folderId) {
      loadFolderInfo()
    }
    loadStats()
  }, [folderId])

  const loadFolderInfo = async () => {
    try {
      const folder = await FileService.getFolder(Number(folderId))
      setCurrentFolder(folder)
    } catch (error) {
      console.error('加载文件夹信息失败:', error)
      setCurrentFolder(null)
    }
  }

  const loadStats = async () => {
    try {
      const stats = await FileService.getFileStats()
      setStats(stats)
    } catch (error) {
      console.error('加载统计信息失败:', error)
    }
  }

  const handleFolderSelect = (folder: Folder) => {
    // 导航到选中的文件夹
    window.location.href = `/files/${folder.id}`
  }

  const handleRefresh = () => {
    if (folderId) {
      loadFolderInfo()
    }
    loadStats()
  }

  const handleFileSelect = (file: any) => {
    // TODO: 实现文件预览功能
    console.log('预览文件:', file)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={280}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div style={{ padding: '16px' }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            <FolderOutlined /> 文件夹结构
          </Title>
          <FolderTree onSelect={handleFolderSelect} />
        </div>
      </Sider>

      <Layout>
        <Content style={{ padding: '24px', background: '#f5f5f5' }}>
          {/* 面包屑导航 */}
          <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item>
              <FolderOutlined />
              <a href="/files">所有文件</a>
            </Breadcrumb.Item>
            {currentFolder && (
              <Breadcrumb.Item>{currentFolder.name}</Breadcrumb.Item>
            )}
          </Breadcrumb>

          {/* 统计信息 */}
          {stats && (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总文件数"
                    value={stats.totalFiles}
                    prefix={<FileOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总存储量"
                    value={FileService.formatFileSize(stats.totalSize)}
                    prefix={<CloudUploadOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="下载次数"
                    value={stats.recentUploads.reduce((sum, file) => sum + file.downloadCount, 0)}
                    prefix={<DownloadOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="最近上传"
                    value={stats.recentUploads.length}
                    prefix={<EyeOutlined />}
                    valueStyle={{ color: '#eb2f96' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* 当前文件夹信息 */}
          {currentFolder && (
            <Card
              style={{ marginBottom: 24 }}
              title="当前文件夹"
              extra={
                <Space>
                  <span>
                    <FolderOutlined /> {currentFolder.name}
                  </span>
                  {currentFolder.description && (
                    <span style={{ color: '#666' }}>
                      - {currentFolder.description}
                    </span>
                  )}
                </Space>
              }
            >
              <p>
                <strong>路径:</strong> {currentFolder.path}
              </p>
              <p>
                <strong>创建时间:</strong> {new Date(currentFolder.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>权限:</strong>{currentFolder.isPublic ? '公开' : '私有'}
              </p>
            </Card>
          )}

          {/* 文件上传和列表 */}
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Title level={4} style={{ margin: 0 }}>
                  文件管理
                </Title>
                <FileUpload
                  folderId={folderId ? Number(folderId) : undefined}
                  onUploadSuccess={() => {
                    handleRefresh()
                  }}
                />
              </Space>
            </div>

            <FileList
              folderId={folderId ? Number(folderId) : undefined}
              onFileSelect={handleFileSelect}
              onRefresh={handleRefresh}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  )
}

export default FileManagementPage