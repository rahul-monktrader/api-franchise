export class ConfigService {
    getBaseUrl(): string {
      if (process.env.NODE_ENV === 'production') {
        return 'https://your-storage-url.com/';
      }
      if (process.env.NODE_ENV === 'development') {
        return 'https://dev.your-storage-url.com/';
      }
      return 'http://localhost:3000/';  // Default local URL
    }
  }
  