// utils/aiService.test.js

// Mock fetch globally
global.fetch = jest.fn();

// Mock console.error to suppress error logs in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Mock the environment variable before any imports
process.env.REACT_APP_OPENAI_API_KEY = 'test-api-key';

describe('OpenAI AI Service', () => {
  // Dynamically import the module in beforeAll to ensure env var is set
  let generateSummary;
  let improveSummary;

  beforeAll(() => {
    // Import after env is set
    const aiService = require('./aiService');
    generateSummary = aiService.generateSummary;
    improveSummary = aiService.improveSummary;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSummary', () => {
    test('successfully generates summary from text', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '<p><strong>Summary</strong></p><p>This is a test summary.</p>',
            },
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateSummary('This is test input text');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      const [url, options] = global.fetch.mock.calls[0];
      
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(options.method).toBe('POST');
      expect(options.headers['Authorization']).toBe('Bearer test-api-key');
      expect(options.headers['Content-Type']).toBe('application/json');

      expect(result).toContain('This is a test summary');
    });

    test('handles long text by truncating', async () => {
      const longText = 'a'.repeat(15000);
      
      const mockResponse = {
        choices: [
          {
            message: {
              content: '<p>Summary of long text</p>',
            },
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await generateSummary(longText);

      const fetchCall = global.fetch.mock.calls[0][1];
      const requestBody = JSON.parse(fetchCall.body);
      const userMessage = requestBody.messages.find(m => m.role === 'user');

      // Should be truncated
      expect(userMessage.content.length).toBeLessThan(longText.length + 100);
      expect(userMessage.content).toContain('[truncated]');
    });

    test('wraps non-HTML response in paragraph tags', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Plain text summary without HTML tags',
            },
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateSummary('Test input');

      expect(result).toContain('<p>');
      expect(result).toContain('</p>');
    });

    test('throws error when API key is missing', async () => {
      // Save original
      const originalKey = process.env.REACT_APP_OPENAI_API_KEY;
      delete process.env.REACT_APP_OPENAI_API_KEY;

      // Reload module
      jest.resetModules();
      const { generateSummary: generateSummaryNoKey } = require('./aiService');

      await expect(generateSummaryNoKey('Test')).rejects.toThrow(
        'OpenAI API key not found'
      );

      // Restore
      process.env.REACT_APP_OPENAI_API_KEY = originalKey;
    });

    test('handles 401 unauthorized error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      await expect(generateSummary('Test')).rejects.toThrow(
        'Invalid OpenAI API key'
      );
    });

    test('handles 429 rate limit error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(generateSummary('Test')).rejects.toThrow(
        'rate limit exceeded'
      );
    });

    test('handles 500 server error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(generateSummary('Test')).rejects.toThrow(
        'OpenAI service error'
      );
    });

    test('handles network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(generateSummary('Test')).rejects.toThrow('Network error');
    });

    test('handles invalid response format', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      await expect(generateSummary('Test')).rejects.toThrow(
        'Invalid response format'
      );
    });

    test('handles empty response content', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '   ' } }],
        }),
      });

      await expect(generateSummary('Test')).rejects.toThrow(
        'OpenAI returned empty summary'
      );
    });

    test('handles JSON parsing error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('JSON parse error');
        },
      });

      await expect(generateSummary('Test')).rejects.toThrow(
        'Invalid response format'
      );
    });
  });

  describe('improveSummary', () => {
    test('successfully improves summary content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '<p><strong>Improved Summary</strong></p><p>Enhanced content with better flow.</p>',
            },
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await improveSummary('<p>Original summary content</p>');

      expect(result).toContain('Improved Summary');
      expect(result).toContain('Enhanced content');
    });

    test('strips HTML from input before sending to API', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '<p>Improved content</p>',
            },
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await improveSummary('<p><strong>Bold text</strong> and <em>italic</em></p>');

      const fetchCall = global.fetch.mock.calls[0][1];
      const requestBody = JSON.parse(fetchCall.body);
      const userMessage = requestBody.messages.find(m => m.role === 'user');

      // Should not contain HTML tags
      expect(userMessage.content).not.toContain('<strong>');
      expect(userMessage.content).not.toContain('<em>');
      expect(userMessage.content).toContain('Bold text');
    });

    test('wraps non-HTML response in paragraph tags', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Plain improved text',
            },
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await improveSummary('<p>Original</p>');

      expect(result).toContain('<p>');
      expect(result).toContain('</p>');
    });

    test('includes system prompt for improvement guidelines', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '<p>Improved</p>',
            },
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await improveSummary('<p>Test content</p>');

      const fetchCall = global.fetch.mock.calls[0][1];
      const requestBody = JSON.parse(fetchCall.body);
      const systemMessage = requestBody.messages.find(m => m.role === 'system');

      expect(systemMessage.content).toContain('improve');
      expect(systemMessage.content).toContain('clarity');
      expect(systemMessage.content).toContain('preserving');
    });

    test('handles API errors gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(improveSummary('<p>Test</p>')).rejects.toThrow(
        'Failed to improve summary'
      );

      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
    });

    test('handles empty improved content', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '' } }],
        }),
      });

      await expect(improveSummary('<p>Test</p>')).rejects.toThrow(
        'OpenAI returned empty improved content'
      );

      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('API request configuration', () => {
    test('uses correct model in requests', async () => {
      const mockResponse = {
        choices: [{ message: { content: '<p>Test</p>' } }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await generateSummary('Test');

      const fetchCall = global.fetch.mock.calls[0][1];
      const requestBody = JSON.parse(fetchCall.body);

      expect(requestBody.model).toBe('gpt-4o');
    });

    test('sets appropriate temperature', async () => {
      const mockResponse = {
        choices: [{ message: { content: '<p>Test</p>' } }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await generateSummary('Test');

      const fetchCall = global.fetch.mock.calls[0][1];
      const requestBody = JSON.parse(fetchCall.body);

      expect(requestBody.temperature).toBe(0.7);
    });

    test('sets max_tokens limit', async () => {
      const mockResponse = {
        choices: [{ message: { content: '<p>Test</p>' } }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await generateSummary('Test');

      const fetchCall = global.fetch.mock.calls[0][1];
      const requestBody = JSON.parse(fetchCall.body);

      expect(requestBody.max_tokens).toBe(1500);
    });

    test('includes proper headers in API request', async () => {
      const mockResponse = {
        choices: [{ message: { content: '<p>Test</p>' } }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await generateSummary('Test');

      const [url, options] = global.fetch.mock.calls[0];
      
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toBe('Bearer test-api-key');
    });
  });
});