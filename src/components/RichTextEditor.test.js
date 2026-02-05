// components/RichTextEditor.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RichTextEditor from './RichTextEditor';

describe('RichTextEditor Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.execCommand
    document.execCommand = jest.fn();
  });

  test('renders editor with toolbar', () => {
    render(<RichTextEditor content="" onChange={mockOnChange} disabled={false} />);
    
    expect(screen.getByRole('toolbar', { name: /Text formatting/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Document summary editor/i })).toBeInTheDocument();
  });

  test('renders all formatting buttons', () => {
    render(<RichTextEditor content="" onChange={mockOnChange} disabled={false} />);
    
    expect(screen.getByRole('button', { name: /Bold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Italic/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Underline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bullet list/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Numbered list/i })).toBeInTheDocument();
  });

  test('initializes editor with provided content', () => {
    const content = '<p>Test content</p>';
    render(<RichTextEditor content={content} onChange={mockOnChange} disabled={false} />);
    
    const editor = screen.getByRole('textbox', { name: /Document summary editor/i });
    expect(editor.innerHTML).toBe(content);
  });

  test('calls onChange when content is edited', () => {
    render(<RichTextEditor content="" onChange={mockOnChange} disabled={false} />);
    
    const editor = screen.getByRole('textbox', { name: /Document summary editor/i });
    
    fireEvent.input(editor, {
      target: { innerHTML: '<p>New content</p>' },
    });
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  test('executes bold command when bold button is clicked', () => {
    render(<RichTextEditor content="" onChange={mockOnChange} disabled={false} />);
    
    const boldButton = screen.getByRole('button', { name: /Bold/i });
    fireEvent.click(boldButton);
    
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);
  });

  test('executes italic command when italic button is clicked', () => {
    render(<RichTextEditor content="" onChange={mockOnChange} disabled={false} />);
    
    const italicButton = screen.getByRole('button', { name: /Italic/i });
    fireEvent.click(italicButton);
    
    expect(document.execCommand).toHaveBeenCalledWith('italic', false, null);
  });

  test('executes underline command when underline button is clicked', () => {
    render(<RichTextEditor content="" onChange={mockOnChange} disabled={false} />);
    
    const underlineButton = screen.getByRole('button', { name: /Underline/i });
    fireEvent.click(underlineButton);
    
    expect(document.execCommand).toHaveBeenCalledWith('underline', false, null);
  });

  test('executes bullet list command when bullet list button is clicked', () => {
    render(<RichTextEditor content="" onChange={mockOnChange} disabled={false} />);
    
    const bulletButton = screen.getByRole('button', { name: /Bullet list/i });
    fireEvent.click(bulletButton);
    
    expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList', false, null);
  });

  test('executes numbered list command when numbered list button is clicked', () => {
    render(<RichTextEditor content="" onChange={mockOnChange} disabled={false} />);
    
    const numberedButton = screen.getByRole('button', { name: /Numbered list/i });
    fireEvent.click(numberedButton);
    
    expect(document.execCommand).toHaveBeenCalledWith('insertOrderedList', false, null);
  });

  test('disables all buttons when disabled prop is true', () => {
    render(<RichTextEditor content="" onChange={mockOnChange} disabled={true} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  test('makes editor non-editable when disabled', () => {
    render(<RichTextEditor content="<p>Test</p>" onChange={mockOnChange} disabled={true} />);
    
    const editor = screen.getByRole('textbox', { name: /Document summary editor/i });
    expect(editor).toHaveAttribute('contenteditable', 'false');
  });

  test('does not execute commands when disabled', () => {
    render(<RichTextEditor content="" onChange={mockOnChange} disabled={true} />);
    
    const boldButton = screen.getByRole('button', { name: /Bold/i });
    fireEvent.click(boldButton);
    
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  test('updates content when content prop changes', () => {
    const { rerender } = render(
      <RichTextEditor content="<p>Initial</p>" onChange={mockOnChange} disabled={false} />
    );
    
    const editor = screen.getByRole('textbox', { name: /Document summary editor/i });
    expect(editor.innerHTML).toBe('<p>Initial</p>');
    
    rerender(
      <RichTextEditor content="<p>Updated</p>" onChange={mockOnChange} disabled={false} />
    );
    
    expect(editor.innerHTML).toBe('<p>Updated</p>');
  });
});