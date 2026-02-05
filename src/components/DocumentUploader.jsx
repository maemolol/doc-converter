// components/DocumentUploader.jsx
import React, { useRef, useState } from 'react';
import './DocumentUploader.css';

// Supported file types and validation
const SUPPORTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/png': '.png',
  'image/jpeg': '.jpg,.jpeg',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Document uploader component with drag-and-drop support
 * Validates file type and size before processing
 */
function DocumentUploader({ onFileUpload, disabled, isProcessing, processingStage }) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * Validates uploaded file against type and size constraints
   * @param {File} file - File to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  const validateFile = (file) => {
    setValidationError(null);

    // Check file type
    if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
      setValidationError(
        `Unsupported file type. Please upload a PDF, DOCX, PNG, or JPEG file.`
      );
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setValidationError(
        `File size exceeds 10MB limit. Please upload a smaller file.`
      );
      return false;
    }

    return true;
  };

  /**
   * Handles file selection from input or drag-and-drop
   * @param {File} file - Selected file
   */
  const handleFile = (file) => {
    if (validateFile(file)) {
      onFileUpload(file);
    }
  };

  /**
   * Handles file input change event
   * @param {Event} event - Change event
   */
  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  /**
   * Handles drag enter event
   * @param {DragEvent} event - Drag event
   */
  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  /**
   * Handles drag leave event
   * @param {DragEvent} event - Drag event
   */
  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  /**
   * Handles drag over event
   * @param {DragEvent} event - Drag event
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handles file drop event
   * @param {DragEvent} event - Drop event
   */
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  /**
   * Opens file selection dialog
   */
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Gets processing stage display text
   * @returns {string} - Display text for current processing stage
   */
  const getProcessingText = () => {
    switch (processingStage) {
      case 'uploading':
        return 'Uploading file...';
      case 'extracting':
        return 'Extracting text...';
      case 'summarizing':
        return 'Generating AI summary...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="document-uploader">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload document"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="file-input"
          aria-label="File input"
        />

        {isProcessing ? (
          <div className="processing-state">
            <div className="spinner-large"></div>
            <p className="processing-text">{getProcessingText()}</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📄</div>
            <h3>Drag and drop your document here</h3>
            <p>or click to browse</p>
            <p className="supported-formats">
              Supported formats: PDF, DOCX, PNG, JPEG (max 10MB)
            </p>
          </>
        )}
      </div>

      {validationError && (
        <div className="validation-error" role="alert">
          {validationError}
        </div>
      )}
    </div>
  );
}

export default DocumentUploader;