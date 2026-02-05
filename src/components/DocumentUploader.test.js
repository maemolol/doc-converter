// components/DocumentUploader.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentUploader from './DocumentUploader';

describe('DocumentUploader Component', () => {
  const mockOnFileUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload area', () => {
    render(<DocumentUploader onFileUpload={mockOnFileUpload} disabled={false} />);
    
    expect(screen.getByText(/Drag and drop your document here/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported formats/i)).toBeInTheDocument();
  });

  test('accepts valid PDF file', () => {
    render(<DocumentUploader onFileUpload={mockOnFileUpload} disabled={false} />);
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/File input/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(mockOnFileUpload).toHaveBeenCalledWith(file);
  });

  test('accepts valid DOCX file', () => {
    render(<DocumentUploader onFileUpload={mockOnFileUpload} disabled={false} />);
    
    const file = new File(['test'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const input = screen.getByLabelText(/File input/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(mockOnFileUpload).toHaveBeenCalledWith(file);
  });

  test('accepts valid image files', () => {
    render(<DocumentUploader onFileUpload={mockOnFileUpload} disabled={false} />);
    
    const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/File input/i);
    
    fireEvent.change(input, { target: { files: [pngFile] } });
    
    expect(mockOnFileUpload).toHaveBeenCalledWith(pngFile);

    jest.clearAllMocks();

    const jpgFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [jpgFile] } });
    
    expect(mockOnFileUpload).toHaveBeenCalledWith(jpgFile);
  });

  test('rejects unsupported file type', () => {
    render(<DocumentUploader onFileUpload={mockOnFileUpload} disabled={false} />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/File input/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(mockOnFileUpload).not.toHaveBeenCalled();
    expect(screen.getByText(/Unsupported file type/i)).toBeInTheDocument();
  });

  test('rejects file exceeding size limit', () => {
    render(<DocumentUploader onFileUpload={mockOnFileUpload} disabled={false} />);
    
    // Create a file larger than 10MB
    const largeFile = new File([new Array(11 * 1024 * 1024).join('a')], 'large.pdf', {
      type: 'application/pdf',
    });
    const input = screen.getByLabelText(/File input/i);
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    expect(mockOnFileUpload).not.toHaveBeenCalled();
    expect(screen.getByText(/File size exceeds 10MB/i)).toBeInTheDocument();
  });

  test('handles drag and drop', () => {
    render(<DocumentUploader onFileUpload={mockOnFileUpload} disabled={false} />);
    
    const uploadArea = screen.getByRole('button', { name: /Upload document/i });
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.dragEnter(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(uploadArea).toHaveClass('dragging');
    
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(mockOnFileUpload).toHaveBeenCalledWith(file);
    expect(uploadArea).not.toHaveClass('dragging');
  });

  test('shows processing state when isProcessing is true', () => {
    render(
      <DocumentUploader
        onFileUpload={mockOnFileUpload}
        disabled={false}
        isProcessing={true}
        processingStage="extracting"
      />
    );
    
    expect(screen.getByText(/Extracting text.../i)).toBeInTheDocument();
    expect(screen.queryByText(/Drag and drop/i)).not.toBeInTheDocument();
  });

  test('disables upload when disabled prop is true', () => {
    render(<DocumentUploader onFileUpload={mockOnFileUpload} disabled={true} />);
    
    const uploadArea = screen.getByRole('button', { name: /Upload document/i });
    const input = screen.getByLabelText(/File input/i);
    
    expect(uploadArea).toHaveClass('disabled');
    expect(input).toBeDisabled();
  });

  test('does not trigger drag events when disabled', () => {
    render(<DocumentUploader onFileUpload={mockOnFileUpload} disabled={true} />);
    
    const uploadArea = screen.getByRole('button', { name: /Upload document/i });
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.dragEnter(uploadArea);
    
    expect(uploadArea).not.toHaveClass('dragging');
    
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(mockOnFileUpload).not.toHaveBeenCalled();
  });
});