import React, { useState, useEffect } from 'react'
import {
  Modal,
  Spin,
  Image,
  Typography,
  Button,
  Space,
  Tag,
  Descriptions,
  message,
} from 'antd'
import {
  FileOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  CloseOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { FileService } from '@services/fileService'
import type { File as FileType } from '@types/index'

const { Title, Text, Paragraph } = Typography

interface FilePreviewProps {
  visible: boolean
  file: FileType | null
  onClose: () => void
}

const FilePreview: React.FC<FilePreviewProps> = ({
  visible,
  file,
  onClose,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (file && visible) {
      loadPreview()
    }
  }, [file, visible])

  const loadPreview = async () => {
    if (!file) return

    setLoading(true)
    setError('')

    try {
      // 根据文件类型生成预览URL
      if (FileService.getFileType(file.mimeType) === 'image') {
        // 图片直接使用文件URL
        setPreviewUrl(`/api/files/preview/${file.id}`)
      } else if (file.mimeType === 'application/pdf') {
        // PDF文件
        setPreviewUrl(`/api/files/preview/${file.id}`)
      } else if (file.mimeType.startsWith('text/')) {
        // 文本文件
        setPreviewUrl(`/api/files/preview/${file.id}`)
      } else {
        // 其他文件类型不支持预览
        setError('该文件类型不支持预览')
      }
    } catch (error) {
      console.error('加载预览失败:', error)
      setError('预览加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!file) return

    try {
      await FileService.downloadFile(file.id, file.originalName)
    } catch (error) {
      console.error('下载失败:', error)
      message.error('下载失败')
    }
  }

  const handleShare = () => {
    if (!file) return
    // TODO: 实现文件分享功能
    message.info('文件分享功能正在开发中')
  }

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
          flexDirection: 'column',
        }}>
          <Spin size="large" />
          <Text style={{ marginTop: 16 }}>加载预览中...</Text>
        </div>
      )
    }

    if (error) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
          flexDirection: 'column',
        }}>
          <Text type="danger" style={{ marginBottom: 16 }}>
            {error}
          </Text>
          <Button onClick={loadPreview}>重试</Button>
        </div>
      )
    }

    if (!previewUrl) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
          flexDirection: 'column',
        }}>
          <FileOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
          <Text type="secondary">无预览内容</Text>
        </div>
      )
    }

    // 根据文件类型渲染不同的预览内容
    if (FileService.getFileType(file.mimeType) === 'image') {
      return (
        <div style={{ textAlign: 'center' }}>
          <Image
            src={previewUrl}
            alt={file.originalName}
            style={{ maxWidth: '100%', maxHeight: 500 }}
            placeholder="图片加载失败"
          />
        </div>
      )
    }

    if (file.mimeType === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          width="100%"
          height="500"
          title={file.originalName}
          style={{ border: '1px solid #d9d9d9' }}
        />
      )
    }

    if (file.mimeType.startsWith('text/')) {
      return (
        <iframe
          src={previewUrl}
          width="100%"
          height="500"
          title={file.originalName}
          style={{ border: '1px solid #d9d9d9' }}
        />
      )
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 400,
      }}>
        <FileOutlined style={{ fontSize: 48, color: '#ccc' }} />
        <Text type="secondary">该文件类型暂不支持预览</Text>
      </div>
    )
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={800}
      title={
        <Space>
          <EyeOutlined />
          <span>文件预览</span>
        </Space>
      }
      footer={[
        <Button icon={<CloseOutlined />} onClick={onClose}>
          关闭
        </Button>,
        file && (
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              下载
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={handleShare}>
              分享
            </Button>
          </Space>
        ),
      ]}
      destroyOnClose
    >
      {file && (
        <div>
          {/* 文件信息 */}
          <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 6 }}>
            <Descriptions column={2} size="small" bordered={false}>
              <Descriptions.Item label="文件名">
                {file.originalName}
              </Descriptions.Item>
              <Descriptions.Item label="文件大小">
                {FileService.formatFileSize(file.size)}
              </Descriptions.Item>
              <Descriptions.Item label="文件类型">
                <Tag color={FileService.getFileType(file.mimeType)}>
                  {FileService.getFileType(file.mimeType)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="上传时间">
                {new Date(file.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="下载次数">
                {file.downloadCount || 0}
              </Descriptions.Item>
              <Descriptions.Item label="文件描述" span={2}>
                {file.description || '暂无描述'}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* 预览内容 */}
          <div style={{ marginTop: 16 }}>
            {renderPreviewContent()}
          </div>
        </div>
      )}
    </Modal>
  )
}

export default FilePreview