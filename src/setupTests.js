// setupTests.js
import '@testing-library/jest-dom';

// Mock window.URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

// Mock FileReader
global.FileReader = class FileReader {
  readAsDataURL() {
    this.onload({ target: { result: 'data:image/png;base64,mock' } });
  }
  readAsArrayBuffer() {
    this.onload({ target: { result: new ArrayBuffer(8) } });
  }
};