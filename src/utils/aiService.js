// utils/aiService.js
/**
 * AI Service for text summarization and improvement using OpenAI GPT
 * 
 * Setup Instructions:
 * 1. Install OpenAI SDK: npm install openai
 * 2. Create a .env file in your project root
 * 3. Add your API key: REACT_APP_OPENAI_API_KEY=your_api_key_here
 * 4. Restart your development server
 * 
 * Security Note:
 * For production, implement a backend API to securely handle OpenAI requests.
 * Never expose API keys in client-side code in production environments.
 */

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const USE_MOCK_MODE = !OPENAI_API_KEY || process.env.REACT_APP_USE_MOCK_AI === 'true';
const MODEL = 'gpt-3.5-turbo'; // Using GPT-4 Optimized for best results, can use 'gpt-3.5-turbo' for cost savings

/**
 * Makes a request to OpenAI's Chat Completion API
 * @param {Array} messages - Array of message objects for the conversation
 * @param {number} maxTokens - Maximum tokens for the response
 * @returns {Promise<string>} - AI response text
 */
async function callOpenAI(messages, maxTokens = 1000, retries = 2) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OpenAI API key not found. Please add REACT_APP_OPENAI_API_KEY to your .env file.'
    );
  }

  let response;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });
    } catch (error) {
      console.error('Network error calling OpenAI:', error);
      throw new Error('Network error: Unable to connect to OpenAI API. Please check your internet connection.');
    }

    if (!response) {
      throw new Error('No response received from OpenAI API');
    }

    // Handle rate limiting with exponential backoff
    if (response.status === 429 && attempt < retries) {
      const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      console.log(`Rate limited. Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }

    // Handle HTTP errors
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = {};
      }
      
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your credentials.');
      } else if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again in a few minutes.');
      } else if (response.status === 500 || response.status === 502 || response.status === 503) {
        throw new Error('OpenAI service error. Please try again in a moment.');
      } else {
        throw new Error(
          errorData.error?.message || `OpenAI API error: ${response.status}`
        );
      }
    }

    // Success - break out of retry loop
    break;
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Invalid response format from OpenAI API');
  }
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Invalid OpenAI response structure:', data);
    throw new Error('Invalid response format from OpenAI API');
  }

  return data.choices[0].message.content.trim();
}

/**
 * Generates a concise summary from extracted text using GPT
 * Uses AI to create well-structured, professional summary
 * 
 * @param {string} text - The extracted text to summarize
 * @returns {Promise<string>} - AI-generated summary in HTML format
 */
export async function generateSummary(text) {
  // MOCK MODE - Return fake summary without API call
  if (USE_MOCK_MODE) {
    console.log('🎭 Using MOCK mode for AI summary');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    
    const preview = text.substring(0, 200).replace(/\s+/g, ' ').trim();
    
    return `<p><strong>Document Summary</strong></p>
<p>This document contains important information regarding ${preview}${text.length > 200 ? '...' : ''}</p>
<p><strong>Key Points:</strong></p>
<ul>
  <li>Main topic and context identified from the source material</li>
  <li>Critical findings and central arguments presented clearly</li>
  <li>Actionable recommendations and strategic conclusions highlighted</li>
  <li>Supporting evidence and relevant details appropriately integrated</li>
</ul>
<p>The content has been analyzed and summarized to provide a concise overview while preserving essential information and maintaining professional tone.</p>`;
  }

  // REAL API MODE
  const maxInputLength = 12000;
  const truncatedText = text.length > maxInputLength 
    ? text.substring(0, maxInputLength) + '...[truncated]'
    : text;

  const messages = [
    {
      role: 'system',
      content: `You are a professional document summarizer. Your task is to create clear, concise, and well-structured summaries that capture the essential information from documents.

Guidelines:
- Use HTML formatting with <p> tags for paragraphs
- Use <strong> for emphasis on key points
- Use <ul> and <li> for bullet points when listing items
- Maintain a professional, neutral tone
- Preserve all critical information
- Keep the summary concise but comprehensive
- Use clear, simple language`
    },
    {
      role: 'user',
      content: `Please provide a concise, well-structured summary of the following document. Use HTML formatting with paragraphs (<p>) and bullet lists (<ul>, <li>) where appropriate. Include a brief overview followed by key points.

Document text:
${truncatedText}`
    }
  ];

  try {
    const summary = await callOpenAI(messages, 1500);
    
    if (!summary || summary.trim().length === 0) {
      throw new Error('OpenAI returned empty summary');
    }

    if (!summary.includes('<p>') && !summary.includes('<ul>')) {
      return `<p>${summary.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }

    return summary;
  } catch (error) {
    console.error('Error generating summary with OpenAI:', error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}

/**
 * Improves existing summary content using GPT
 * Enhances clarity, flow, and conciseness while preserving meaning
 * 
 * @param {string} currentContent - The current editor content (HTML)
 * @param {string} customInstructions - Optional custom improvement instructions from user
 * @returns {Promise<string>} - Improved content in HTML format
 */
export async function improveSummary(currentContent, customInstructions = '') {
  // MOCK MODE - Return fake improved summary
  if (USE_MOCK_MODE) {
    console.log('🎭 Using MOCK mode for AI improvement');
    console.log('📝 Custom instructions:', customInstructions || 'None (general improvement)');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    
    const plainText = currentContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();
    
    const preview = plainText.substring(0, 150).replace(/\s+/g, ' ').trim();
    
    const instructionNote = customInstructions 
      ? `<p><em>Improvements applied: ${customInstructions}</em></p>` 
      : '';
    
    return `<p><strong>Enhanced Document Summary</strong></p>
${instructionNote}
<p>This refined analysis presents ${preview}${plainText.length > 150 ? '...' : ''} with improved clarity and professional structure.</p>
<p><strong>Key Highlights:</strong></p>
<ul>
  <li>Core concepts articulated with enhanced precision and flow</li>
  <li>Critical insights presented with improved readability and impact</li>
  <li>Strategic conclusions refined for maximum clarity and actionability</li>
  <li>Supporting evidence integrated seamlessly throughout the narrative</li>
</ul>
<p>This enhanced version delivers superior comprehension while maintaining accuracy and preserving all essential information from the original content.</p>`;
  }

  // REAL API MODE
  const plainText = currentContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();

  // Build system prompt based on whether custom instructions are provided
  const systemPrompt = customInstructions
    ? `You are an expert editor focused on improving document summaries. The user has provided specific instructions on how to improve the summary.

Your task: Follow the user's instructions precisely while maintaining the factual accuracy of the content.

Guidelines:
- Follow the user's improvement instructions carefully
- Maintain factual accuracy - do not add false information
- Use HTML formatting with <p> tags for paragraphs
- Use <strong> for emphasis and <ul>/<li> for lists
- Preserve the core meaning and key points
- Only make changes that align with the user's instructions`
    : `You are an expert editor focused on improving document summaries. Your task is to enhance clarity, flow, and conciseness while preserving all important information and the original meaning.

Guidelines:
- Maintain the core message and all key points
- Improve sentence structure and flow
- Remove redundancy and wordiness
- Enhance readability and professional tone
- Use HTML formatting with <p> tags for paragraphs
- Use <strong> for emphasis and <ul>/<li> for lists
- Do not add new information not present in the original
- Keep the improved version roughly the same length or shorter`;

  const userPrompt = customInstructions
    ? `Please improve the following summary according to these specific instructions:

INSTRUCTIONS: ${customInstructions}

Current summary:
${plainText}

Return the improved version with HTML formatting.`
    : `Please improve the following summary for better clarity, flow, and conciseness. Maintain all key information and the original meaning. Return the improved version with HTML formatting.

Current summary:
${plainText}`;

  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: userPrompt
    }
  ];

  try {
    const improvedContent = await callOpenAI(messages, 1500);
    
    if (!improvedContent || improvedContent.trim().length === 0) {
      throw new Error('OpenAI returned empty improved content');
    }

    if (!improvedContent.includes('<p>') && !improvedContent.includes('<ul>')) {
      return `<p>${improvedContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }

    return improvedContent;
  } catch (error) {
    console.error('Error improving summary with OpenAI:', error);
    throw new Error(`Failed to improve summary: ${error.message}`);
  }
}