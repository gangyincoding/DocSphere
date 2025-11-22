import React, { useState, useEffect, useCallback } from 'react'
import {
  Tree,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Dropdown,
  Menu,
} from 'antd'
import {
  FolderOutlined,
  FolderAddOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { FolderService } from '@services/fileService'
import type { Folder } from '../../types'

interface FolderTreeProps {
  onSelect?: (folder: Folder) => void
  selectedFolderId?: number
}

const FolderTree: React.FC<FolderTreeProps> = ({
  onSelect,
  selectedFolderId,
}) => {
  const [treeData, setTreeData] = useState<DataNode[]>([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [form] = Form.useForm()

  // 加载文件夹树
  const loadFolders = useCallback(async () => {
    try {
      const response = await FolderService.getFolderTree()
      if (!response.success || !response.data) {
        throw new Error(response.message || '获取文件夹树失败')
      }
      const treeData = convertToTreeData(response.data as any)
      setTreeData(treeData)
    } catch (error) {
      console.error('加载文件夹失败:', error)
      message.error('加载文件夹失败')
    }
  }, [])

  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  // 转换文件夹数据为树形结构
  const convertToTreeData = (folders: Folder[]): DataNode[] => {
    const buildTree = (parentFolderId?: number): DataNode[] => {
      return folders
        .filter(folder => folder.parentId === parentFolderId)
        .map(folder => ({
          title: (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                paddingRight: 8,
              }}
            >
              <span>{folder.name}</span>
              <Dropdown
                overlay={
                  <Menu
                    onClick={({ key }) => handleFolderAction(key, folder)}
                  >
                    <Menu.Item key="create" icon={<PlusOutlined />}>
                      新建子文件夹
                    </Menu.Item>
                    <Menu.Item key="edit" icon={<EditOutlined />}>
                      编辑
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
                      删除
                    </Menu.Item>
                  </Menu>
                }
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  style={{ opacity: 0.6 }}
                />
              </Dropdown>
            </span>
          ),
          key: folder.id.toString(),
          icon: <FolderOutlined />,
          isLeaf: false,
          children: buildTree(folder.id),
          data: folder,
        }))
    }

    // 添加根级别文件夹
    return buildTree()
  }

  // 处理文件夹操作
  const handleFolderAction = async (action: string, folder: Folder) => {
    switch (action) {
      case 'create':
        setEditingFolder({
          ...folder,
          name: '',
          description: '',
          isPublic: false,
        } as any)
        showCreateModal()
        break
      case 'edit':
        setEditingFolder(folder)
        showCreateModal()
        break
      case 'delete':
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除文件夹 "${folder.name}" 吗？该操作将同时删除文件夹内的所有文件。`,
          onOk: () => handleDeleteFolder(folder),
        })
        break
    }
  }

  // 删除文件夹
  const handleDeleteFolder = async (folder: Folder) => {
    try {
      const response = await FolderService.deleteFolder(folder.id)
      if (!response.success) {
        throw new Error(response.message || '删除文件夹失败')
      }
      message.success('文件夹删除成功')
      loadFolders()
    } catch (error) {
      console.error('删除文件夹失败:', error)
      message.error('删除文件夹失败')
    }
  }

  // 显示创建/编辑模态框
  const showCreateModal = () => {
    setCreateModalVisible(true)
  }

  // 处理模态框确认
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingFolder && editingFolder.id) {
        // 更新文件夹
        const response = await FolderService.updateFolder(editingFolder.id, {
          name: values.name.trim(),
          description: values.description?.trim(),
          isPublic: values.isPublic,
        })
        if (!response.success) {
          throw new Error(response.message || '更新文件夹失败')
        }
        message.success('文件夹更新成功')
      } else {
        // 创建文件夹
        const response = await FolderService.createFolder({
          name: values.name.trim(),
          parentId: editingFolder?.id,
          description: values.description?.trim(),
          isPublic: values.isPublic,
        })
        if (!response.success) {
          throw new Error(response.message || '创建文件夹失败')
        }
        message.success('文件夹创建成功')
      }

      setCreateModalVisible(false)
      setEditingFolder(null)
      form.resetFields()
      loadFolders()
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败')
    }
  }

  // 处理模态框取消
  const handleModalCancel = () => {
    setCreateModalVisible(false)
    setEditingFolder(null)
    form.resetFields()
  }

  // 处理节点选择
  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    if (selectedKeys.length > 0 && info.selected) {
      const node = info.selectedNodes[0]
      const folder = node.data as Folder
      onSelect?.(folder)
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<FolderAddOutlined />}
            onClick={() => {
              setEditingFolder(null)
              showCreateModal()
            }}
          >
            新建文件夹
          </Button>
          <Button icon={<FolderOutlined />} onClick={loadFolders}>
            刷新
          </Button>
        </Space>
      </div>

      <Tree
        showLine
        showIcon
        defaultExpandAll
        selectedKeys={selectedFolderId ? [selectedFolderId.toString()] : []}
        onSelect={handleSelect}
        treeData={treeData}
      />

      {/* 创建/编辑文件夹模态框 */}
      <Modal
        title={editingFolder?.id ? '编辑文件夹' : '新建文件夹'}
        open={createModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="文件夹名称"
            name="name"
            initialValue={editingFolder?.name || ''}
            rules={[
              { required: true, message: '请输入文件夹名称' },
              { min: 1, max: 50, message: '文件夹名称长度为1-50个字符' },
              { pattern: /^[^\\s\\/:*?"<>|]+$/, message: '文件夹名称不能包含特殊字符' },
            ]}
          >
            <Input placeholder="请输入文件夹名称" />
          </Form.Item>

          <Form.Item
            label="父文件夹"
            name="parentName"
            initialValue={editingFolder?.parentId ? `已选择: ${editingFolder.name}` : '根目录'}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            initialValue={editingFolder?.description || ''}
          >
            <Input.TextArea
              placeholder="请输入文件夹描述（可选）"
              rows={3}
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            label="可见性"
            name="isPublic"
            initialValue={editingFolder?.isPublic || false}
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
    </div>
  )
}

export default FolderTree