import { FranchiseService } from 'src/franchise/franchise.service';
export declare class FileUploadService {
    private franchiseService;
    private s3;
    private bucketName;
    constructor(franchiseService: FranchiseService);
    generatePresignedUrl(fileType: string, fileName: string): Promise<{
        presignedUrl: string;
        fileKey: string;
    }>;
    getPresignedUrl(fileKey: string): Promise<string>;
    uploadBase64File(base64Image: string, email: string, documentType: string): Promise<{
        fileUrl: string;
        fileKey: string;
        localPath: string;
    }>;
    deleteFile(fileKey: string): Promise<void>;
    deleteDocuments(franchiseId: string, files: {
        aadharfront?: boolean;
        aadharBack?: boolean;
        panCard?: boolean;
    }): Promise<{
        success: boolean;
        deletedFiles: string[];
        failedFiles: string[];
        message: string;
    }>;
    private cleanUpFolderIfEmpty;
}
