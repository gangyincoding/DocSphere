import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FileUpload from './FileUpload'

// Simple test to verify the testing setup works
describe('FileUpload Component - Basic Tests', () => {
  it('renders without crashing', () => {
    const onUploadSuccess = vi.fn()
    render(<FileUpload onUploadSuccess={onUploadSuccess} />)

    const uploadButton = screen.getByText('上传文件')
    expect(uploadButton).toBeInTheDocument()
  })

  it('has correct button text', () => {
    const onUploadSuccess = vi.fn()
    render(<FileUpload onUploadSuccess={onUploadSuccess} />)

    expect(screen.getByRole('button', { name: /上传文件/i })).toBeInTheDocument()
  })
})