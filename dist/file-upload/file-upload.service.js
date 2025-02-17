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
exports.FileUploadService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const fs = require("fs");
const path = require("path");
const franchise_service_1 = require("../franchise/franchise.service");
let FileUploadService = class FileUploadService {
    constructor(franchiseService) {
        this.franchiseService = franchiseService;
    }
    async generatePresignedUrl(fileType, fileName) {
        const bucketName = process.env.AWS_S3_BUCKET_NAME;
        const fileKey = `uploads/${fileName}`;
        const params = {
            Bucket: bucketName,
            Key: fileKey,
            Expires: 60 * 5,
            ContentType: fileType,
        };
        const presignedUrl = await this.s3.getSignedUrlPromise('putObject', params);
        return { presignedUrl, fileKey };
    }
    async getPresignedUrl(fileKey) {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileKey,
            Expires: 3600,
        };
        try {
            const url = this.s3.getSignedUrl('getObject', params);
            return url;
        }
        catch (error) {
            throw new Error('Error generating pre-signed URL: ' + error.message);
        }
    }
    async uploadBase64File(base64Image, email, documentType) {
        try {
            const matches = base64Image.match(/^data:(.+?);base64,(.+)$/);
            if (!matches) {
                throw new common_1.InternalServerErrorException('Invalid Base64 format');
            }
            const mimeType = matches[1];
            const fileBuffer = Buffer.from(matches[2], 'base64');
            const fileExtension = mimeType.split('/')[1] || 'jpg';
            const fileName = `${(0, uuid_1.v4)()}_${documentType}.${fileExtension}`;
            const fileKey = `${email}/${fileName}`;
            const localDir = path.join(process.cwd(), 'src', 'uploads', email);
            if (!fs.existsSync(localDir)) {
                fs.mkdirSync(localDir, { recursive: true });
            }
            const localFilePath = path.join(localDir, fileName);
            fs.writeFileSync(localFilePath, fileBuffer);
            const fileUrl = `/uploads/${email}/${fileName}`;
            console.log(`File saved successfully at: ${localFilePath}`);
            return { fileUrl, fileKey, localPath: localFilePath };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to upload file: ${error.message}`);
        }
    }
    async deleteFile(fileKey) {
        try {
            const params = {
                Bucket: 'your-bucket-name',
                Key: fileKey,
            };
            await this.s3.deleteObject(params).promise();
        }
        catch (error) {
            throw new Error(`Failed to delete file from S3: ${error.message}`);
        }
    }
    async deleteDocuments(franchiseId, files) {
        const franchisee = await this.franchiseService.findById(Number(franchiseId));
        if (!franchisee) {
            return { success: false, deletedFiles: [], failedFiles: [], message: 'Franchisee not found' };
        }
        const { franchise_code } = franchisee;
        const fieldMapping = {
            aadharfront: 'aadhar_front_key',
            aadharBack: 'aadhar_back_key',
            panCard: 'pan_card_key',
        };
        const existingValues = {
            aadhar_front_key: franchisee.aadhar_front_key,
            aadhar_back_key: franchisee.aadhar_back_key,
            pan_card_key: franchisee.pan_card_key,
        };
        const deletedFiles = [];
        const failedFiles = [];
        const updatedFields = {};
        for (const [fieldKey, shouldDelete] of Object.entries(files)) {
            const backendKey = fieldMapping[fieldKey];
            if (shouldDelete && existingValues[backendKey]) {
                const fileName = existingValues[backendKey];
                let filePath = path.join(process.cwd(), 'src', 'uploads', fileName);
                if (filePath.includes(`${franchise_code}/${franchise_code}`)) {
                    filePath = filePath.replace(`${franchise_code}/${franchise_code}`, franchise_code);
                }
                filePath = filePath.replace(/\\/g, '/');
                console.log(`Attempting to delete: ${filePath}`);
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        deletedFiles.push(fileName);
                        updatedFields[backendKey] = null;
                    }
                    else {
                        failedFiles.push(`${fileName} not found at ${filePath}`);
                    }
                }
                catch (error) {
                    console.error(`Error deleting ${fileName}:`, error);
                    failedFiles.push(`Failed to delete ${fileName}`);
                }
            }
        }
        if (Object.keys(updatedFields).length > 0) {
            await this.franchiseService.updateFranchisee(Number(franchiseId), updatedFields);
        }
        const folderPath = path.join(process.cwd(), 'src', 'uploads', franchise_code);
        await this.cleanUpFolderIfEmpty(folderPath);
        return {
            success: deletedFiles.length > 0 || failedFiles.length === 0,
            deletedFiles,
            failedFiles,
            message: deletedFiles.length > 0 ? 'Documents deleted successfully' : 'No documents deleted',
        };
    }
    async cleanUpFolderIfEmpty(folderPath) {
        try {
            const files = fs.readdirSync(folderPath);
            if (files.length === 0) {
                fs.rmdirSync(folderPath, { recursive: true });
            }
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to clean up folder: ${error.message}`);
        }
    }
};
exports.FileUploadService = FileUploadService;
exports.FileUploadService = FileUploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [franchise_service_1.FranchiseService])
], FileUploadService);
//# sourceMappingURL=file-upload.service.js.map