// components/DocumentUploader.jsx - Add OCR progress display
import React, { useRef, useState } from 'react';
import './DocumentUploader.css';

const SUPPORTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/png': '.png',
  'image/jpeg': '.jpg,.jpeg',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function DocumentUploader({ onFileUpload, disabled, isProcessing, processingStage, ocrProgress }) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    setValidationError(null);

    if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
      setValidationError(
        `Unsupported file type. Please upload a PDF, DOCX, PNG, or JPEG file.`
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError(
        `File size exceeds 10MB limit. Please upload a smaller file.`
      );
      return false;
    }

    return true;
  };

  const handleFile = (file) => {
    if (validateFile(file)) {
      onFileUpload(file);
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

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

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getProcessingText = () => {
    switch (processingStage) {
      case 'uploading':
        return 'Uploading file...';
      case 'extracting':
        return ocrProgress > 0 
          ? `Recognizing text... ${ocrProgress}%` 
          : 'Extracting text...';
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
            {ocrProgress > 0 && (
              <div className="ocr-progress-bar">
                <div 
                  className="ocr-progress-fill" 
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="upload-icon">📄</div>
            <h3>Drag and drop your document here</h3>
            <p>or click to browse</p>
            <p className="supported-formats">
              Supported formats: PDF, DOCX, PNG, JPEG (max 10MB)
            </p>
            <p className="ocr-note">
              📸 Images will be processed with OCR to extract text
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