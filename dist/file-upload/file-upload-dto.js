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
exports.UploadDocumentsDto = void 0;
const class_validator_1 = require("class-validator");
class UploadDocumentsDto {
}
exports.UploadDocumentsDto = UploadDocumentsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^data:image\/(png|jpeg|jpg);base64,/, {
        message: 'Invalid file format. Only PNG, JPEG, or JPG files are allowed in base64 format.',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Aadhar front is required.' }),
    __metadata("design:type", String)
], UploadDocumentsDto.prototype, "aadharfront", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^data:image\/(png|jpeg|jpg);base64,/, {
        message: 'Invalid file format. Only PNG, JPEG, or JPG files are allowed in base64 format.',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Aadhar back is required.' }),
    __metadata("design:type", String)
], UploadDocumentsDto.prototype, "aadharBack", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^data:image\/(png|jpeg|jpg);base64,/, {
        message: 'Invalid file format. Only PNG, JPEG, or JPG files are allowed in base64 format.',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Pan card is required.' }),
    __metadata("design:type", String)
], UploadDocumentsDto.prototype, "panCard", void 0);
//# sourceMappingURL=file-upload-dto.js.map