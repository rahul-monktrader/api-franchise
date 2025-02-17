import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FranchiseService } from 'src/franchise/franchise.service';
import { UploadDocumentsDto } from './file-upload-dto';
export declare class FileUploadController {
    private readonly fileUploadService;
    private readonly franchiseeService;
    constructor(fileUploadService: FileUploadService, franchiseeService: FranchiseService);
    uploadDocuments(files: UploadDocumentsDto, req: any, res: any): Promise<any>;
    deleteDocuments(files: {
        aadharfront?: boolean;
        aadharBack?: boolean;
        panCard?: boolean;
    }, req: any, res: any): Promise<any>;
    getImage(fileKey: string, res: any): Promise<any>;
}
