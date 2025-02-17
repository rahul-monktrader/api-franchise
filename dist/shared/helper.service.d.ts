export declare class HelperService {
    constructor();
    uploadFilePath(): Promise<{
        storage: any;
    } | undefined>;
    ensureDirectoryExistence(dirPath: string): Promise<void>;
    getFilePath(filename: string): string;
    emailTemplate: (companyName: string, emailId: string, createPasswordLink: string) => string;
    generateStrongPassword(length?: number): string;
    hashPassword(plainPassword: any): Promise<string>;
    getFunctionNameFromStack(): string;
}
