// App.jsx
import React, { useState, useRef } from 'react';
import './App.css';
import DocumentUploader from './components/DocumentUploader';
import RichTextEditor from './components/RichTextEditor';
import ImprovementModal from './components/ImprovementModal';
import { extractTextFromFile } from './utils/fileParser';
import { generateSummary, improveSummary } from './utils/aiService';

/**
 * Main application component for document summarization workflow
 * Manages state for file upload, text extraction, AI summarization, and editor content
 */
function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState(null);
  const [processingStage, setProcessingStage] = useState('');
  const [showImprovementModal, setShowImprovementModal] = useState(false);

  /**
   * Handles file upload and initiates the summarization workflow
   * @param {File} file - The uploaded file
   */
  const handleFileUpload = async (file) => {
    setError(null);
    setIsProcessing(true);
    setProcessingStage('uploading');
    setUploadedFile(file);
    setExtractedText('');
    setEditorContent('');

    try {
      // Extract text from the uploaded file
      setProcessingStage('extracting');
      const text = await extractTextFromFile(file);
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the file. Please ensure the file contains readable text.');
      }

      setExtractedText(text);

      // Generate AI summary from extracted text
      setProcessingStage('summarizing');
      const summary = await generateSummary(text);
      
      if (!summary || summary.trim().length === 0) {
        throw new Error('Failed to generate summary. Please try again.');
      }

      setEditorContent(summary);
      setProcessingStage('');
    } catch (err) {
      setError(err.message);
      setProcessingStage('');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Opens the improvement modal
   */
  const handleImproveClick = () => {
    if (!editorContent || editorContent.trim().length === 0) {
      setError('No content to improve. Please upload a document first.');
      return;
    }
    setShowImprovementModal(true);
  };

  /**
   * Handles "Improve with AI" feature with custom instructions
   * @param {string} instructions - Custom improvement instructions from user
   */
  const handleImproveWithAI = async (instructions) => {
    setShowImprovementModal(false);
    setError(null);
    setIsImproving(true);

    try {
      const improvedContent = await improveSummary(editorContent, instructions);
      
      if (!improvedContent || improvedContent.trim().length === 0) {
        throw new Error('Failed to improve content. Please try again.');
      }

      setEditorContent(improvedContent);
    } catch (err) {
      // Don't overwrite content on failure
      setError(err.message);
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * Updates editor content when user makes manual edits
   * @param {string} content - Updated HTML content from editor
   */
  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  const isAnyProcessing = isProcessing || isImproving;

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Document Summarizer</h1>
        <p>Upload a document to generate an AI-powered summary</p>
      </header>

      <main className="app-main">
        {/* File Upload Section */}
        <section className="upload-section">
          <DocumentUploader
            onFileUpload={handleFileUpload}
            disabled={isAnyProcessing}
            isProcessing={isProcessing}
            processingStage={processingStage}
          />
        </section>

        {/* Error Display */}
        {error && (
          <div className="error-message" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Editor Section - Only show after successful summarization */}
        {editorContent && (
          <section className="editor-section">
            <div className="editor-header">
              <h2>Summary</h2>
              <button
                className="improve-button"
                onClick={handleImproveClick}
                disabled={isAnyProcessing}
                aria-label="Improve summary with AI"
              >
                {isImproving ? (
                  <>
                    <span className="spinner"></span>
                    Improving...
                  </>
                ) : (
                  <>
                    <span className="sparkle-icon">✨</span>
                    Improve with AI
                  </>
                )}
              </button>
            </div>
            
            <RichTextEditor
              content={editorContent}
              onChange={handleEditorChange}
              disabled={isAnyProcessing}
            />
          </section>
        )}
      </main>

      {/* Improvement Modal */}
      {showImprovementModal && (
        <ImprovementModal
          onImprove={handleImproveWithAI}
          onCancel={() => setShowImprovementModal(false)}
        />
      )}
    </div>
  );
}

export default App;