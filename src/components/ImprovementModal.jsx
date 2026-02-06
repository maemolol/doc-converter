// components/ImprovementModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import './ImprovementModal.css';

/**
 * Modal component for specifying custom improvement instructions
 * Allows users to provide specific guidance on how to improve their summary
 */
function ImprovementModal({ onImprove, onCancel }) {
  const [instructions, setInstructions] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const textareaRef = useRef(null);

  // Preset improvement instructions
  const presets = [
    {
      id: 'concise',
      label: 'Make it more concise',
      value: 'Make this summary more concise and to-the-point. Remove unnecessary words while keeping all key information.'
    },
    {
      id: 'detailed',
      label: 'Add more detail',
      value: 'Expand this summary with more detail and context. Provide additional explanation for key points.'
    },
    {
      id: 'professional',
      label: 'More professional tone',
      value: 'Rewrite this summary with a more formal and professional tone suitable for business communication.'
    },
    {
      id: 'casual',
      label: 'More casual tone',
      value: 'Rewrite this summary with a more casual and conversational tone that\'s easier to read.'
    },
    {
      id: 'technical',
      label: 'More technical',
      value: 'Make this summary more technical and precise. Use industry-specific terminology where appropriate.'
    },
    {
      id: 'simple',
      label: 'Simpler language',
      value: 'Simplify this summary using plain language that anyone can understand. Avoid jargon and complex terms.'
    },
    {
      id: 'bullets',
      label: 'Convert to bullet points',
      value: 'Reorganize this summary as a clear list of bullet points, with each point being concise and actionable.'
    },
    {
      id: 'executive',
      label: 'Executive summary style',
      value: 'Rewrite this as an executive summary: brief, action-oriented, and focused on key takeaways and decisions.'
    }
  ];

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /**
   * Handles preset selection
   * @param {string} presetId - ID of selected preset
   */
  const handlePresetClick = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setInstructions(preset.value);
      setSelectedPreset(presetId);
      textareaRef.current?.focus();
    }
  };

  /**
   * Handles form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (instructions.trim()) {
      onImprove(instructions.trim());
    } else {
      // If no custom instructions, use default improvement
      onImprove('');
    }
  };

  /**
   * Handles textarea change
   * @param {Event} e - Change event
   */
  const handleTextareaChange = (e) => {
    setInstructions(e.target.value);
    // Clear selected preset if user modifies text
    if (selectedPreset) {
      const preset = presets.find(p => p.id === selectedPreset);
      if (preset && e.target.value !== preset.value) {
        setSelectedPreset('');
      }
    }
  };

  /**
   * Handles escape key to close modal
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel} onKeyDown={handleKeyDown}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Improve Summary with AI</h2>
          <button
            className="modal-close"
            onClick={onCancel}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="modal-description">
              Tell the AI how you'd like to improve your summary. Choose a preset or write your own instructions.
            </p>

            {/* Preset Buttons */}
            <div className="preset-buttons">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`preset-button ${selectedPreset === preset.id ? 'selected' : ''}`}
                  onClick={() => handlePresetClick(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Instructions Textarea */}
            <div className="instructions-section">
              <label htmlFor="improvement-instructions">
                Custom Instructions (Optional)
              </label>
              <textarea
                ref={textareaRef}
                id="improvement-instructions"
                className="instructions-textarea"
                value={instructions}
                onChange={handleTextareaChange}
                placeholder="E.g., 'Focus more on the financial aspects' or 'Remove the technical jargon' or leave empty for general improvements..."
                rows="4"
              />
            </div>

            <div className="instructions-hint">
              <strong>Tip:</strong> Be specific about what you want changed. The AI will follow your instructions while preserving the core content.
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="cancel-button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="improve-submit-button"
            >
              <span className="sparkle-icon">✨</span>
              Improve Summary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ImprovementModal;