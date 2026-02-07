// utils/fileParser.js
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text content from uploaded file based on file type
 * @param {File} file - The uploaded file
 * @param {Function} onProgress - Optional progress callback for OCR
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromFile(file, onProgress = null) {
  const fileType = file.type;

  try {
    if (fileType === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await extractTextFromDOCX(file);
    } else if (fileType.startsWith('image/')) {
      return await extractTextFromImage(file, onProgress);
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Extracts text from PDF file (supports multi-page)
 * @param {File} file - PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  // Extract text from each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText.trim();
}

/**
 * Extracts text from DOCX file
 * @param {File} file - DOCX file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Extracts text from image using Tesseract.js OCR
 * Supports multiple languages and provides progress updates
 * 
 * @param {File} file - Image file
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Promise<string>} - Extracted text via OCR
 */
async function extractTextFromImage(file, onProgress = null) {
  let worker = null;
  
  try {
    console.log('🔍 Starting OCR on image:', file.name);
    
    // Create Tesseract worker with proper configuration for React
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        console.log('OCR Progress:', m);
        
        // Call progress callback if provided
        if (onProgress) {
          if (m.status === 'recognizing text') {
            onProgress({
              status: m.status,
              progress: m.progress // 0 to 1
            });
          } else if (m.status === 'loading tesseract core' || 
                     m.status === 'initializing tesseract' ||
                     m.status === 'loading language traineddata') {
            onProgress({
              status: m.status,
              progress: m.progress || 0
            });
          }
        }
      },
      // Use CDN for worker files to avoid bundling issues
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core-simd.wasm.js',
    });

    console.log('✅ Worker created and initialized');

    // Perform OCR
    const { data: { text, confidence } } = await worker.recognize(file);
    
    console.log(`✅ OCR completed with ${(confidence).toFixed(1)}% confidence`);

    // Validate OCR results
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be recognized in the image. The image may be too blurry, low quality, or may not contain any text.');
    }

    // Warn if confidence is low
    if (confidence < 60) {
      console.warn(`⚠️ Low OCR confidence (${confidence.toFixed(1)}%). Results may be inaccurate.`);
    }

    return text.trim();
  } catch (error) {
    console.error('OCR Error:', error);
    
    if (error.message && error.message.includes('recognize')) {
      throw new Error('Failed to recognize text in image. Please ensure the image contains clear, readable text.');
    }
    
    throw new Error(`OCR processing failed: ${error.message}`);
  } finally {
    // Always terminate worker to free up resources
    if (worker) {
      try {
        await worker.terminate();
        console.log('🧹 Worker terminated');
      } catch (e) {
        console.warn('Failed to terminate worker:', e);
      }
    }
  }
}

/**
 * Advanced OCR with multi-language support
 * @param {File} file - Image file
 * @param {Array<string>} languages - Array of language codes (e.g., ['eng', 'fra', 'deu'])
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromImageMultiLang(file, languages = ['eng'], onProgress = null) {
  let worker = null;
  
  try {
    console.log(`🔍 Starting OCR with languages: ${languages.join(', ')}`);
    
    const langString = languages.join('+');
    
    worker = await createWorker(langString, 1, {
      logger: (m) => {
        console.log('OCR Progress:', m);
        if (onProgress) {
          onProgress({
            status: m.status,
            progress: m.progress || 0
          });
        }
      },
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core-simd.wasm.js',
    });

    const { data: { text, confidence } } = await worker.recognize(file);
    
    console.log(`✅ Multi-language OCR completed with ${(confidence).toFixed(1)}% confidence`);

    if (!text || text.trim().length === 0) {
      throw new Error('No text could be recognized in the image.');
    }

    return text.trim();
  } catch (error) {
    console.error('Multi-language OCR Error:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        console.warn('Failed to terminate worker:', e);
      }
    }
  }
}