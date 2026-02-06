import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text content from uploaded file based on file type
 * @param {File} file - The uploaded file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromFile(file) {
  const fileType = file.type;

  try {
    if (fileType === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await extractTextFromDOCX(file);
    } else if (fileType.startsWith('image/')) {
      return await extractTextFromImage(file);
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
 * Extracts text from image using OCR
 * NOTE: This is a placeholder for real OCR integration
 * In production, integrate with services like:
 * - Google Cloud Vision API
 * - AWS Textract
 * - Azure Computer Vision
 * - Tesseract.js (client-side OCR)
 * 
 * @param {File} file - Image file
 * @returns {Promise<string>} - Extracted text via OCR
 */
async function extractTextFromImage(file) {
  // PLACEHOLDER: Real OCR integration needed here
  // Example with Tesseract.js:
  // import Tesseract from 'tesseract.js';
  // const { data: { text } } = await Tesseract.recognize(file, 'eng');
  // return text;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // TODO: Replace with actual OCR service call
        // Mock implementation for testing purposes
        const mockOCRText = `This is extracted text from the image: ${file.name}
        
The image appears to contain a document with multiple paragraphs of text.
This is a placeholder response that simulates OCR text extraction.

In a production environment, this would be replaced with actual OCR processing
using a service like Google Cloud Vision, AWS Textract, or Tesseract.js.`;
        
        // Simulate OCR processing delay
        await new Promise(res => setTimeout(res, 1500));
        resolve(mockOCRText);
      } catch (error) {
        reject(new Error('OCR processing failed'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(file);
  });
}