"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
class ConfigService {
    getBaseUrl() {
        if (process.env.NODE_ENV === 'production') {
            return 'https://your-storage-url.com/';
        }
        if (process.env.NODE_ENV === 'development') {
            return 'https://dev.your-storage-url.com/';
        }
        return 'http://localhost:3000/';
    }
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=config.service.js.map