// components/RichTextEditor.jsx
import React, { useRef, useEffect } from 'react';
import './RichTextEditor.css';

/**
 * Rich text editor component with formatting toolbar
 * Supports bold, italic, underline, and lists
 */
function RichTextEditor({ content, onChange, disabled }) {
  const editorRef = useRef(null);

  /**
   * Initialize editor with content on mount or content change
   */
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  /**
   * Handles content changes in the editor
   */
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  /**
   * Executes formatting command on selected text
   * @param {string} command - The formatting command to execute
   * @param {string} value - Optional value for the command
   */
  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  /**
   * Handles toolbar button click
   * @param {string} command - The formatting command
   */
  const handleToolbarClick = (command) => {
    if (disabled) return;
    executeCommand(command);
  };

  return (
    <div className={`rich-text-editor ${disabled ? 'disabled' : ''}`}>
      {/* Formatting Toolbar */}
      <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
        <button
          type="button"
          className="toolbar-button"
          onClick={() => handleToolbarClick('bold')}
          disabled={disabled}
          aria-label="Bold"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        
        <button
          type="button"
          className="toolbar-button"
          onClick={() => handleToolbarClick('italic')}
          disabled={disabled}
          aria-label="Italic"
          title="Italic"
        >
          <em>I</em>
        </button>
        
        <button
          type="button"
          className="toolbar-button"
          onClick={() => handleToolbarClick('underline')}
          disabled={disabled}
          aria-label="Underline"
          title="Underline"
        >
          <u>U</u>
        </button>

        <div className="toolbar-divider"></div>
        
        <button
          type="button"
          className="toolbar-button"
          onClick={() => handleToolbarClick('insertUnorderedList')}
          disabled={disabled}
          aria-label="Bullet list"
          title="Bullet list"
        >
          • List
        </button>
        
        <button
          type="button"
          className="toolbar-button"
          onClick={() => handleToolbarClick('insertOrderedList')}
          disabled={disabled}
          aria-label="Numbered list"
          title="Numbered list"
        >
          1. List
        </button>
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable={!disabled}
        onInput={handleInput}
        role="textbox"
        aria-label="Document summary editor"
        aria-multiline="true"
      />
    </div>
  );
}

export default RichTextEditor;