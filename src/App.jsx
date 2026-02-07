// App.jsx - Add OCR progress tracking
import React, { useState, useRef } from 'react';
import './App.css';
import DocumentUploader from './components/DocumentUploader';
import RichTextEditor from './components/RichTextEditor';
import ImprovementModal from './components/ImprovementModal';
import { extractTextFromFile } from './utils/fileParser';
import { generateSummary, improveSummary } from './utils/aiService';

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState(null);
  const [processingStage, setProcessingStage] = useState('');
  const [showImprovementModal, setShowImprovementModal] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

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
    setOcrProgress(0);

    try {
      // Extract text from the uploaded file
      setProcessingStage('extracting');
      
      // Progress callback for OCR
      const handleOcrProgress = (progressData) => {
        if (progressData.progress) {
          setOcrProgress(Math.round(progressData.progress * 100));
        }
      };
      
      const text = await extractTextFromFile(file, handleOcrProgress);
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the file. Please ensure the file contains readable text.');
      }

      setExtractedText(text);
      setOcrProgress(0);

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
      setOcrProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImproveClick = () => {
    if (!editorContent || editorContent.trim().length === 0) {
      setError('No content to improve. Please upload a document first.');
      return;
    }
    setShowImprovementModal(true);
  };

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
      setError(err.message);
    } finally {
      setIsImproving(false);
    }
  };

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
        <section className="upload-section">
          <DocumentUploader
            onFileUpload={handleFileUpload}
            disabled={isAnyProcessing}
            isProcessing={isProcessing}
            processingStage={processingStage}
            ocrProgress={ocrProgress}
          />
        </section>

        {error && (
          <div className="error-message" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

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