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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadController = void 0;
const common_1 = require("@nestjs/common");
const jwt_authguard_1 = require("../email-verification/jwt.authguard");
const file_upload_service_1 = require("./file-upload.service");
const franchise_service_1 = require("../franchise/franchise.service");
const file_upload_dto_1 = require("./file-upload-dto");
const slack_util_1 = require("../shared/slack.util");
let FileUploadController = class FileUploadController {
    constructor(fileUploadService, franchiseeService) {
        this.fileUploadService = fileUploadService;
        this.franchiseeService = franchiseeService;
    }
    async uploadDocuments(files, req, res) {
        const franchiseId = req.user.franchiseId;
        const cleanBase64 = (file) => {
            return file.replace(/\s+/g, '');
        };
        try {
            const franchisee = await this.franchiseeService.findById(franchiseId);
            if (!franchisee) {
                throw new common_1.BadRequestException('Franchisee not found');
            }
            const { email } = franchisee;
            const updatedFields = {};
            const uploadedFiles = {};
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
            const errors = [];
            const providedFiles = Object.keys(files).filter(fieldKey => files[fieldKey]);
            if (providedFiles.length !== 3) {
                return res.status(common_1.HttpStatus.OK).json({
                    message: 'All fields should be provided',
                    statusCode: common_1.HttpStatus.OK,
                    status: false,
                });
            }
            const uploadFile = async (file, fieldKey, documentType) => {
                const backendKey = fieldMapping[fieldKey];
                const cleanedFile = cleanBase64(file);
                const { fileUrl, fileKey } = await this.fileUploadService.uploadBase64File(cleanedFile, email, documentType);
                updatedFields[backendKey] = fileKey;
                uploadedFiles[backendKey] = { fileKey, fileUrl };
            };
            for (const [fieldKey, file] of Object.entries(files)) {
                const backendKey = fieldMapping[fieldKey];
                if (file && existingValues[backendKey]) {
                    errors.push(`${fieldKey} already exists. Please delete the existing document before uploading a new one.`);
                }
                else {
                    let documentType;
                    if (fieldKey === 'aadharfront') {
                        documentType = 'aadhar_front';
                    }
                    else if (fieldKey === 'aadharBack') {
                        documentType = 'aadhar_back';
                    }
                    else if (fieldKey === 'panCard') {
                        documentType = 'pan_card';
                    }
                    else {
                        documentType = '';
                    }
                    if (file) {
                        await uploadFile(file, fieldKey, documentType);
                    }
                    else if (existingValues[backendKey]) {
                        updatedFields[backendKey] = null;
                    }
                }
            }
            if (errors.length > 0) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    message: errors.join(', '),
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    status: false,
                    data: []
                });
            }
            await this.franchiseeService.updateFranchisee(franchiseId, updatedFields);
            await (0, slack_util_1.sendSlackMessage)({
                message: `A franchise has uploaded documents! Franchise: ${franchisee.firstname} ${franchisee.lastname}`,
                module: 'Franchise',
                filename: 'File-Upload',
                status: true,
            });
            return res.status(common_1.HttpStatus.OK).json({
                message: 'Documents uploaded/updated successfully',
                statusCode: common_1.HttpStatus.OK,
                status: true,
                data: uploadedFiles
            });
        }
        catch (error) {
            console.error('Error uploading documents:', error);
            await (0, slack_util_1.sendSlackMessage)({
                message: `Error uploading documents: ${error.message}`,
                module: 'Franchise',
                filename: 'File-Upload',
                status: false,
            });
            const statusCode = error instanceof common_1.BadRequestException ? common_1.HttpStatus.BAD_REQUEST : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return res.status(statusCode).json({
                statusCode,
                status: false,
                message: error.message || 'An unexpected error occurred while uploading the documents',
                data: []
            });
        }
    }
    async deleteDocuments(files, req, res) {
        const franchiseId = req.user.franchiseId;
        try {
            const result = await this.fileUploadService.deleteDocuments(franchiseId, files);
            if (!result.success) {
                return res.status(common_1.HttpStatus.OK).json({
                    message: result.message || 'Unable to delete files',
                    statusCode: common_1.HttpStatus.OK,
                    status: false,
                    deletedFiles: result.deletedFiles,
                    failedFiles: result.failedFiles,
                });
            }
            return res.status(common_1.HttpStatus.OK).json({
                message: result.message,
                statusCode: common_1.HttpStatus.OK,
                status: true,
                deletedFiles: result.deletedFiles,
                failedFiles: result.failedFiles,
            });
        }
        catch (error) {
            console.error('Error deleting documents:', error);
            await (0, slack_util_1.sendSlackMessage)({
                message: `Error deleting documents: ${error.message}`,
                module: 'Franchise-delete',
                filename: 'File-Upload',
                status: false,
            });
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || 'An unexpected error occurred while deleting the documents',
                deletedFiles: [],
                failedFiles: [],
            });
        }
    }
    async getImage(fileKey, res) {
        try {
            const url = await this.fileUploadService.getPresignedUrl(fileKey);
            return res.status(200).json({
                message: 'Image URL retrieved successfully',
                url,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: 'Error retrieving image URL',
                error: error.message,
            });
        }
    }
};
exports.FileUploadController = FileUploadController;
__decorate([
    (0, common_1.UseGuards)(jwt_authguard_1.JwtAuthGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true })),
    (0, common_1.Post)('upload'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [file_upload_dto_1.UploadDocumentsDto, Object, Object]),
    __metadata("design:returntype", Promise)
], FileUploadController.prototype, "uploadDocuments", null);
__decorate([
    (0, common_1.UseGuards)(jwt_authguard_1.JwtAuthGuard),
    (0, common_1.Delete)('delete'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FileUploadController.prototype, "deleteDocuments", null);
__decorate([
    (0, common_1.Get)('get-image/:fileKey'),
    __param(0, (0, common_1.Param)('fileKey')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FileUploadController.prototype, "getImage", null);
exports.FileUploadController = FileUploadController = __decorate([
    (0, common_1.Controller)('franchise/file'),
    __metadata("design:paramtypes", [file_upload_service_1.FileUploadService,
        franchise_service_1.FranchiseService])
], FileUploadController);
//# sourceMappingURL=file-upload.controller.js.map