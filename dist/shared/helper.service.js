"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelperService = void 0;
const common_1 = require("@nestjs/common");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
const crypto = require("crypto");
const argon2 = require("argon2");
let HelperService = class HelperService {
    constructor() {
        this.emailTemplate = (companyName, emailId, createPasswordLink) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${companyName}</title>
    </head>
    <body>
        <h2>Welcome to ${companyName}!</h2>
        <p>Dear User,</p>
        <p>We are excited to have you on board. Below are your login details:</p>
        <p><strong>Email:</strong> ${emailId}</p>
        <p>Please click the link below to create your new password:</p>
        <p><a href="${createPasswordLink}" target="_blank" style="color: blue; text-decoration: none;">Create Your Password</a></p>
        <p>If the link doesn't work, copy and paste this URL into your browser:</p>
        <p>${createPasswordLink}</p>
        <p>Please keep this information secure and do not share it with anyone.</p>
        <p>Best regards,</p>
        <p>The ${companyName} Team</p>
    </body>
    </html>
`;
    }
    async uploadFilePath() {
        try {
            const rootPath = process.cwd();
            const uploadPath = (0, path_1.join)(rootPath, 'uploads');
            await this.ensureDirectoryExistence(uploadPath);
            return {
                storage: (0, multer_1.diskStorage)({
                    destination: (req, file, callback) => {
                        callback(null, uploadPath);
                    },
                    filename: (req, file, callback) => {
                        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                        const ext = (0, path_1.extname)(file.originalname);
                        const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
                        callback(null, filename);
                    },
                }),
            };
        }
        catch (err) {
            console.log("error during the uploading file", err);
        }
    }
    async ensureDirectoryExistence(dirPath) {
        try {
            await fs_1.promises.access(dirPath);
        }
        catch (error) {
            await fs_1.promises.mkdir(dirPath, { recursive: true });
        }
    }
    getFilePath(filename) {
        return `uploads/${filename}`;
    }
    generateStrongPassword(length = 12) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
        let password = '';
        const bytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
            password += chars[bytes[i] % chars.length];
        }
        return password;
    }
    async hashPassword(plainPassword) {
        try {
            const hashedPassword = await argon2.hash(plainPassword);
            console.log(hashedPassword);
            return hashedPassword;
        }
        catch (err) {
            console.error('Error hashing password:', err);
            throw err;
        }
    }
    getFunctionNameFromStack() {
        const stack = new Error().stack;
        if (stack) {
            const stackLines = stack.split('\n');
            const callerLine = stackLines[2];
            const match = callerLine.match(/at (\S+)/);
            if (match && match[1]) {
                return match[1];
            }
        }
        return 'unknown';
    }
};
exports.HelperService = HelperService;
exports.HelperService = HelperService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], HelperService);
//# sourceMappingURL=helper.service.js.map