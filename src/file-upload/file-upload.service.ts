import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { S3 } from 'aws-sdk';

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { FranchiseService } from 'src/franchise/franchise.service';
import { sendSlackMessage } from 'src/shared/slack.util';
@Injectable()
export class FileUploadService {
  private s3: S3;
  private bucketName: string;
  constructor(private franchiseService: FranchiseService) {
    // Initialize AWS S3 client with credentials from environment variables

  }

  // Method to generate presigned URL for uploading a file
  async generatePresignedUrl(fileType: string, fileName: string): Promise<{ presignedUrl: string, fileKey: string }> {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;  // Your S3 bucket name (ensure it's in your .env file)

    // Define a file key (path) in S3 where the file will be stored
    const fileKey = `uploads/${fileName}`;  // This can be customized based on how you want to structure the S3 path

    // Configure S3 parameters for generating the presigned URL
    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Expires: 60 * 5,  // URL expiry time in seconds (5 minutes)
      ContentType: fileType,  // MIME type for the file (image/jpeg for example)
    };

    // Generate the presigned URL using AWS SDK
    const presignedUrl = await this.s3.getSignedUrlPromise('putObject', params);

    // Return the presigned URL along with the file key (which can be used to store the file path in the database)
    return { presignedUrl, fileKey };
  }



  async getPresignedUrl(fileKey: string): Promise<string> {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,  // Your S3 bucket name
      Key: fileKey, // The file key (unique identifier) stored in the database
      Expires: 3600,  // The expiration time in seconds (e.g., 1 hour)
    };

    try {
      // Generate the pre-signed URL
      const url = this.s3.getSignedUrl('getObject', params);
      return url;  // Return the pre-signed URL to the client
    } catch (error) {
      throw new Error('Error generating pre-signed URL: ' + error.message);
    }
  }


  async uploadBase64File(
    base64Image: string,
    email: string,
    documentType: string  // New parameter for document type (e.g., 'aadhar_front', 'aadhar_back', 'pan_card')
  ): Promise<{ fileUrl: string; fileKey: string; localPath: string }> {
    try {
      const matches = base64Image.match(/^data:(.+?);base64,(.+)$/);
      if (!matches) {
        throw new InternalServerErrorException('Invalid Base64 format');
      }
  
      const mimeType = matches[1]; // Extract MIME type
      const fileBuffer = Buffer.from(matches[2], 'base64'); // Convert Base64 to Buffer
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const fileName = `${uuidv4()}_${documentType}.${fileExtension}`;  // Include document type in the file name
      const fileKey = `${email}/${fileName}`;
  
      // Use process.cwd() to get the project root directory
      const localDir = path.join(process.cwd(), 'src', 'uploads', email);
  
  
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true }); // Ensure the folder exists
      }
  
      const localFilePath = path.join(localDir, fileName);
      fs.writeFileSync(localFilePath, fileBuffer); // Save file locally
  
      const fileUrl = `/uploads/${email}/${fileName}`;  // The URL used in the frontend
  
      console.log(`File saved successfully at: ${localFilePath}`);
  
      return { fileUrl, fileKey, localPath: localFilePath };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to upload file: ${error.message}`);
    }
}
  async deleteFile(fileKey: string): Promise<void> {
    try {
      const params = {
        Bucket: 'your-bucket-name', // Replace with your S3 bucket name
        Key: fileKey, // The file's key in the S3 bucket
      };

      // Call S3 deleteObject API to remove the file
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }



  async deleteDocuments(
    franchiseId: string,
    files: { aadharfront?: boolean; aadharBack?: boolean; panCard?: boolean }
  ): Promise<{ success: boolean; deletedFiles: string[]; failedFiles: string[]; message: string }> {
    const franchisee = await this.franchiseService.findById(Number(franchiseId));
    if (!franchisee) {
      return { success: false, deletedFiles: [], failedFiles: [], message: 'Franchisee not found' };
    }
  
    const { franchise_code } = franchisee;
  
    // Define the mapping for file types to database keys
    const fieldMapping: Record<string, string> = {
      aadharfront: 'aadhar_front_key',
      aadharBack: 'aadhar_back_key',
      panCard: 'pan_card_key',
    };
  
    const existingValues = {
      aadhar_front_key: franchisee.aadhar_front_key,
      aadhar_back_key: franchisee.aadhar_back_key,
      pan_card_key: franchisee.pan_card_key,
    };
  
    const deletedFiles: string[] = [];
    const failedFiles: string[] = [];
    const updatedFields: Record<string, string | null> = {}; 
  
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
          } else {
            failedFiles.push(`${fileName} not found at ${filePath}`);
          }
        } catch (error) {
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
  
  
  
  // Function to clean up the folder if it's empty
  private async cleanUpFolderIfEmpty(folderPath: string): Promise<void> {
    try {
      const files = fs.readdirSync(folderPath);  // Get all files in the folder

      if (files.length === 0) {
        // If the folder is empty, remove the folder
        fs.rmdirSync(folderPath, { recursive: true });
      }
    } catch (error) {
      throw new InternalServerErrorException(`Failed to clean up folder: ${error.message}`);
    }
  }
}
