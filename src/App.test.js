// App.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import * as fileParser from './utils/fileParser';
import * as aiService from './utils/aiService';

// Mock utility modules
jest.mock('./utils/fileParser');
jest.mock('./utils/aiService');

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('renders document uploader on initial load', () => {
    render(<App />);
    
    expect(screen.getByText(/AI Document Summarizer/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop your document here/i)).toBeInTheDocument();
  });

  test('does not show editor before file upload', () => {
    render(<App />);
    
    expect(screen.queryByText(/Summary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Improve with AI/i)).not.toBeInTheDocument();
  });

  test('successfully processes file upload and generates summary', async () => {
    const mockExtractedText = 'This is extracted text from the document.';
    const mockSummary = '<p>This is an AI-generated summary.</p>';

    fileParser.extractTextFromFile.mockResolvedValue(mockExtractedText);
    aiService.generateSummary.mockResolvedValue(mockSummary);

    render(<App />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const uploadArea = screen.getByRole('button', { name: /Upload document/i });

    // Simulate file drop
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    // Wait for processing to complete
    await waitFor(() => {
      expect(fileParser.extractTextFromFile).toHaveBeenCalledWith(file);
    });

    await waitFor(() => {
      expect(aiService.generateSummary).toHaveBeenCalledWith(mockExtractedText);
    });

    // Verify editor is displayed with summary
    await waitFor(() => {
      expect(screen.getByText(/Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/Improve with AI/i)).toBeInTheDocument();
    });
  });

  test('displays error when text extraction fails', async () => {
    fileParser.extractTextFromFile.mockRejectedValue(
      new Error('Failed to extract text')
    );

    render(<App />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const uploadArea = screen.getByRole('button', { name: /Upload document/i });

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Failed to extract text/i)).toBeInTheDocument();
    });
  });

  test('displays error when summary generation fails', async () => {
    const mockExtractedText = 'This is extracted text from the document.';

    fileParser.extractTextFromFile.mockResolvedValue(mockExtractedText);
    aiService.generateSummary.mockRejectedValue(
      new Error('AI service unavailable')
    );

    render(<App />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const uploadArea = screen.getByRole('button', { name: /Upload document/i });

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/AI service unavailable/i)).toBeInTheDocument();
    });
  });

  test('displays error when extracted text is empty', async () => {
    fileParser.extractTextFromFile.mockResolvedValue('   ');

    render(<App />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const uploadArea = screen.getByRole('button', { name: /Upload document/i });

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/No text could be extracted/i)).toBeInTheDocument();
    });
  });

  test('"Improve with AI" button improves summary successfully', async () => {
    const mockExtractedText = 'Original text';
    const mockSummary = '<p>Original summary</p>';
    const mockImprovedSummary = '<p>Improved summary with better clarity</p>';

    fileParser.extractTextFromFile.mockResolvedValue(mockExtractedText);
    aiService.generateSummary.mockResolvedValue(mockSummary);
    aiService.improveSummary.mockResolvedValue(mockImprovedSummary);

    render(<App />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const uploadArea = screen.getByRole('button', { name: /Upload document/i });

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Improve with AI/i)).toBeInTheDocument();
    });

    const improveButton = screen.getByRole('button', { name: /Improve with AI/i });
    fireEvent.click(improveButton);

    await waitFor(() => {
      expect(aiService.improveSummary).toHaveBeenCalledWith(mockSummary);
    });
  });

  test('"Improve with AI" button is disabled during processing', async () => {
    const mockExtractedText = 'Original text';
    const mockSummary = '<p>Original summary</p>';

    fileParser.extractTextFromFile.mockResolvedValue(mockExtractedText);
    aiService.generateSummary.mockResolvedValue(mockSummary);
    aiService.improveSummary.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('<p>Improved</p>'), 1000))
    );

    render(<App />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const uploadArea = screen.getByRole('button', { name: /Upload document/i });

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Improve with AI/i)).toBeInTheDocument();
    });

    const improveButton = screen.getByRole('button', { name: /Improve with AI/i });
    fireEvent.click(improveButton);

    // Button should be disabled during processing
    expect(improveButton).toBeDisabled();
    expect(screen.getByText(/Improving.../i)).toBeInTheDocument();
  });

  test('does not overwrite content when "Improve with AI" fails', async () => {
    const mockExtractedText = 'Original text';
    const mockSummary = '<p>Original summary</p>';

    fileParser.extractTextFromFile.mockResolvedValue(mockExtractedText);
    aiService.generateSummary.mockResolvedValue(mockSummary);
    aiService.improveSummary.mockRejectedValue(
      new Error('AI improvement failed')
    );

    render(<App />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const uploadArea = screen.getByRole('button', { name: /Upload document/i });

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Improve with AI/i)).toBeInTheDocument();
    });

    const improveButton = screen.getByRole('button', { name: /Improve with AI/i });
    fireEvent.click(improveButton);

    await waitFor(() => {
      expect(screen.getByText(/AI improvement failed/i)).toBeInTheDocument();
    });

    // Editor should still contain original content
    const editor = screen.getByRole('textbox', { name: /Document summary editor/i });
    expect(editor.innerHTML).toBe(mockSummary);
  });

  test('prevents simultaneous AI requests', async () => {
    const mockExtractedText = 'Original text';
    const mockSummary = '<p>Original summary</p>';

    fileParser.extractTextFromFile.mockResolvedValue(mockExtractedText);
    aiService.generateSummary.mockResolvedValue(mockSummary);
    aiService.improveSummary.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('<p>Improved</p>'), 1000))
    );

    render(<App />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const uploadArea = screen.getByRole('button', { name: /Upload document/i });

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Improve with AI/i)).toBeInTheDocument();
    });

    const improveButton = screen.getByRole('button', { name: /Improve with AI/i });
    
    // Click improve button
    fireEvent.click(improveButton);
    expect(improveButton).toBeDisabled();

    // Try to upload another file while improving
    const file2 = new File(['test2'], 'test2.pdf', { type: 'application/pdf' });
    const uploadArea2 = screen.getByRole('button', { name: /Upload document/i });
    
    // Upload area should be disabled
    expect(uploadArea2).toHaveClass('disabled');
  });
});