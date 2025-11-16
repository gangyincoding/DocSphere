import React, { useState, useCallback } from 'react'
import {
  Upload,
  Button,
  Progress,
  message,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Typography,
} from 'antd'
import {
  InboxOutlined,
  UploadOutlined,
  DeleteOutlined,
  FileOutlined,
} from '@ant-design/icons'
import type { UploadProps, UploadFile as AntdUploadFile } from 'antd'
import { FileService } from '@services/fileService'
import type { UploadFile } from '@types/index'

const { Dragger } = Upload
const { Text, Title } = Typography
const { TextArea } = Input

interface FileUploadProps {
  folderId?: number
  onUploadSuccess?: (file: UploadFile) => void
  accept?: string
  multiple?: boolean
}

interface UploadModalProps {
  visible: boolean
  onCancel: () => void
  onUploadSuccess: (files: UploadFile[]) => void
  folderId?: number
}

const FileUpload: React.FC<FileUploadProps> = ({
  folderId,
  onUploadSuccess,
  accept = '*',
  multiple = false,
}) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [uploading, setUploading] = useState(false)

  const showUploadModal = () => setUploadModalVisible(true)

  const handleUploadSuccess = (file: UploadFile) => {
    message.success(`文件 ${file.originalName} 上传成功！`)
    onUploadSuccess?.(file)
  }

  return (
    <>
      <Button
        type="primary"
        icon={<UploadOutlined />}
        onClick={showUploadModal}
        style={{ marginRight: 8 }}
      >
        上传文件
      </Button>

      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onUploadSuccess={handleUploadSuccess}
        folderId={folderId}
        accept={accept}
        multiple={multiple}
      />
    </>
  )
}

const UploadModal: React.FC<UploadModalProps> = ({
  visible,
  onCancel,
  onUploadSuccess,
  folderId,
  accept,
  multiple,
}) => {
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<AntdUploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const handleFileChange: UploadProps['onChange'] = (info) => {
    const { fileList: newFileList } = info
    setFileList(newFileList)
  }

  const handleRemove = (file: AntdUploadFile) => {
    const newFileList = fileList.filter(item => item.uid !== file.uid)
    setFileList(newFileList)
  }

  const handleTagClose = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputConfirm = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
    }
    setTagInput('')
  }

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请选择要上传的文件')
      return
    }

    const values = await form.validateFields()
    setUploading(true)

    try {
      const uploadedFiles: UploadFile[] = []

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const originFileObj = file.originFileObj as File

        if (!originFileObj) continue

        // 创建FormData
        const formData = new FormData()
        formData.append('file', originFileObj)

        // 添加其他字段
        if (folderId) {
          formData.append('folderId', folderId.toString())
        }
        if (values.description) {
          formData.append('description', values.description)
        }
        if (values.isPublic) {
          formData.append('isPublic', values.isPublic.toString())
        }
        if (tags.length > 0) {
          formData.append('tags', tags.join(','))
        }

        try {
          // 模拟上传进度
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [file.uid]: Math.min((prev[file.uid] || 0) + 10, 90)
            }))
          }, 200)

          const uploadedFile = await FileService.uploadFile({
            file: originFileObj,
            folderId,
            description: values.description,
            isPublic: values.isPublic,
            tags: tags,
          })

          clearInterval(progressInterval)
          setUploadProgress(prev => ({ ...prev, [file.uid]: 100 }))

          uploadedFiles.push(uploadedFile)
          message.success(`${originFileObj.name} 上传成功！`)
        } catch (error) {
          console.error('上传失败:', error)
          message.error(`${originFileObj.name} 上传失败`)
          clearInterval(progressInterval)
        }
      }

      onUploadSuccess(uploadedFiles)
      handleCancel()
    } catch (error) {
      console.error('表单验证失败:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setFileList([])
    setUploadProgress({})
    setTags([])
    setTagInput('')
    onCancel()
  }

  const beforeUpload = (file: File) => {
    const isLt100M = file.size / 1024 / 1024 < 100
    if (!isLt100M) {
      message.error('文件大小不能超过 100MB!')
      return false
    }

    // 检查文件类型限制
    if (accept && accept !== '*') {
      const acceptTypes = accept.split(',').map(type => type.trim())
      const fileType = file.type
      const fileName = file.name.toLowerCase()

      const isAccepted = acceptTypes.some(type => {
        if (type.startsWith('.')) {
          return fileName.endsWith(type.toLowerCase())
        }
        return fileType.includes(type)
      })

      if (!isAccepted) {
        message.error(`不支持的文件类型，仅支持：${accept}`)
        return false
      }
    }

    return false // 阻止自动上传，由我们手动处理
  }

  return (
    <Modal
      title={
        <Space>
          <UploadOutlined />
          <span>上传文件</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={uploading}>
          取消
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          disabled={fileList.length === 0}
        >
          {uploading ? '上传中...' : '开始上传'}
        </Button>,
      ]}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        {/* 文件拖拽上传区域 */}
        <Form.Item label="选择文件" required>
          <Dragger
            name="files"
            multiple={multiple}
            fileList={fileList}
            onChange={handleFileChange}
            onRemove={handleRemove}
            beforeUpload={beforeUpload}
            accept={accept}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              点击或拖拽文件到此区域上传
            </p>
            <p className="ant-upload-hint">
              {multiple ? '支持批量上传' : '单个文件上传'}
              {accept !== '*' && `，仅支持 ${accept} 格式`}
              ，文件大小不超过 100MB
            </p>
          </Dragger>

          {/* 自定义文件列表 */}
          {fileList.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text strong>已选择的文件：</Text>
              <div style={{ marginTop: 8 }}>
                {fileList.map(file => (
                  <div
                    key={file.uid}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      marginBottom: '8px',
                    }}
                  >
                    <FileOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <span style={{ flex: 1 }}>{file.name}</span>
                    <Text type="secondary" style={{ marginRight: 8, fontSize: '12px' }}>
                      {(file.originFileObj as File)?.size &&
                        FileService.formatFileSize((file.originFileObj as File).size)}
                    </Text>
                    {uploadProgress[file.uid] !== undefined && (
                      <Progress
                        percent={uploadProgress[file.uid]}
                        size="small"
                        style={{ width: 120, marginRight: 8 }}
                        showInfo={false}
                      />
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemove(file)}
                      disabled={uploading}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Form.Item>

        {/* 文件描述 */}
        <Form.Item
          label="文件描述"
          name="description"
        >
          <TextArea
            placeholder="请输入文件描述（可选）"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* 文件标签 */}
        <Form.Item label="文件标签">
          <div>
            <div style={{ marginBottom: 8 }}>
              {tags.map(tag => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => handleTagClose(tag)}
                  style={{ marginBottom: 4 }}
                >
                  {tag}
                </Tag>
              ))}
            </div>
            <Input
              placeholder="输入标签后按回车添加"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onPressEnter={handleTagInputConfirm}
              onBlur={handleTagInputConfirm}
              style={{ width: 200 }}
            />
          </div>
        </Form.Item>

        {/* 文件可见性 */}
        <Form.Item
          label="文件可见性"
          name="isPublic"
          initialValue={false}
        >
          <Select
            options={[
              { label: '私有（仅自己可见）', value: false },
              { label: '公开（所有人可见）', value: true },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default FileUpload