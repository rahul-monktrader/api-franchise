import { Controller, Put, Body, UseGuards, Request, BadRequestException, InternalServerErrorException, Res, HttpStatus, Get, Param, UseInterceptors, Post, Delete, ValidationPipe, UsePipes } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/email-verification/jwt.authguard';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FranchiseService } from 'src/franchise/franchise.service';
import { UploadDocumentsDto } from './file-upload-dto';
import { sendSlackMessage } from 'src/shared/slack.util';
@Controller('franchise/file')
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly franchiseeService: FranchiseService,
  ) {}
 
  

  @UseGuards(JwtAuthGuard)
   @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @Post('upload')
  async uploadDocuments(
    @Body() files: UploadDocumentsDto, // Use the DTO to validate the incoming files
    @Request() req: any,
    @Res() res
  ) {
    const franchiseId = req.user.franchiseId;
  
    // Function to clean the Base64 string
    const cleanBase64 = (file: string) => {
      return file.replace(/\s+/g, ''); // Removes all whitespace and newline characters
    };
  
    try {
      // Ensure franchisee exists
      const franchisee = await this.franchiseeService.findById(franchiseId);
      if (!franchisee) {
        throw new BadRequestException('Franchisee not found');
      }
  
      const { email } = franchisee;
  
      const updatedFields: Record<string, string | null> = {}; // Store updated document keys
      const uploadedFiles: Record<string, { fileKey: string; fileUrl: string }> = {}; // Store uploaded file URLs
  
      // Mapping frontend field names to backend keys and document types
      const fieldMapping: Record<string, string> = {
        aadharfront: 'aadhar_front_key',
        aadharBack: 'aadhar_back_key',
        panCard: 'pan_card_key',
      };
  
      // Fetch existing document values from the database
      const existingValues = {
        aadhar_front_key: franchisee.aadhar_front_key,
        aadhar_back_key: franchisee.aadhar_back_key,
        pan_card_key: franchisee.pan_card_key,
      };
  
      // Array to store errors if any document already exists
      const errors: string[] = [];
  
      // Check if none or one/two files are provided (throw error if not all three are present)
      const providedFiles = Object.keys(files).filter(fieldKey => files[fieldKey]);
      if (providedFiles.length !== 3) {
        return res.status(HttpStatus.OK).json({
            message: 'All fields should be provided',
            statusCode: HttpStatus.OK,
            status: false,
          });
      }
  
      // Helper function to process file upload
      const uploadFile = async (file: string, fieldKey: string, documentType: string) => {
        const backendKey = fieldMapping[fieldKey];
  
        // Clean the Base64 string
        const cleanedFile = cleanBase64(file);
  
        // Upload the Base64 file and get the S3 file URL & key
        const { fileUrl, fileKey } = await this.fileUploadService.uploadBase64File(cleanedFile, email, documentType);
  
        // Update the fields to be saved in the franchisee model
        updatedFields[backendKey] = fileKey;
  
        // Store the uploaded file information
        uploadedFiles[backendKey] = { fileKey, fileUrl };
      };
  
      // Iterate over all uploaded files dynamically
      for (const [fieldKey, file] of Object.entries(files)) {
        const backendKey = fieldMapping[fieldKey];
  
        // Check if the file is passed in the request and already exists in the database
        if (file && existingValues[backendKey]) {
          // If document already exists, add to error messages
          errors.push(`${fieldKey} already exists. Please delete the existing document before uploading a new one.`);
        } else {
          // Determine the document type
          let documentType: string;
          if (fieldKey === 'aadharfront') {
            documentType = 'aadhar_front';  // Aadhar front
          } else if (fieldKey === 'aadharBack') {
            documentType = 'aadhar_back';   // Aadhar back
          } else if (fieldKey === 'panCard') {
            documentType = 'pan_card';      // Pan card
          } else {
            documentType = ''; // Handle other fields as needed
          }
  
          if (file) {
            // If the file exists, process and upload it
            await uploadFile(file, fieldKey, documentType);
          } else if (existingValues[backendKey]) {
            // If the request explicitly sets a value as null, remove the file reference
            updatedFields[backendKey] = null;
          }
        }
      }
  
      // If there are any errors, return them
      if (errors.length > 0) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: errors.join(', '),
          statusCode: HttpStatus.BAD_REQUEST,
          status: false,
          data:[]
        });
      }
  
      // Update the franchisee model with the new document keys
      await this.franchiseeService.updateFranchisee(franchiseId, updatedFields);
      await sendSlackMessage({
        message: `A franchise has uploaded documents! Franchise: ${franchisee.firstname} ${franchisee.lastname}`,
        module: 'Franchise',
        filename: 'File-Upload',
        status: true,
      });
  
  
      // Return response with uploaded file URLs
      return res.status(HttpStatus.OK).json({
        message: 'Documents uploaded/updated successfully',
        statusCode: HttpStatus.OK,
        status: true,
        data:uploadedFiles


        
      });
    } catch (error) {
      console.error('Error uploading documents:', error);
      await sendSlackMessage({
        message: `Error uploading documents: ${error.message}`,
        module: 'Franchise',
        filename: 'File-Upload',
        status: false,
      });
  
      const statusCode = error instanceof BadRequestException ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(statusCode).json({
        statusCode,
        status: false,
        message: error.message || 'An unexpected error occurred while uploading the documents',
        data:[]
      });
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  async deleteDocuments(
    @Body() files: { aadharfront?: boolean; aadharBack?: boolean; panCard?: boolean },
    @Request() req: any,
    @Res() res
  ) {
    const franchiseId = req.user.franchiseId;
  
    try {
      const result = await this.fileUploadService.deleteDocuments(franchiseId, files);
      
      if (!result.success) {
        return res.status(HttpStatus.OK).json({  // ✅ Change from BAD_REQUEST (400) to OK (200)
          message: result.message || 'Unable to delete files',
          statusCode: HttpStatus.OK,
          status: false,  // ✅ Indicate failure while keeping status 200
          deletedFiles: result.deletedFiles,
          failedFiles: result.failedFiles,
        });
      }
  
      return res.status(HttpStatus.OK).json({
        message: result.message,
        statusCode: HttpStatus.OK,
        status: true,
        deletedFiles: result.deletedFiles,
        failedFiles: result.failedFiles,
      });
    } catch (error) {
      console.error('Error deleting documents:', error);
  

      await sendSlackMessage({
        message: `Error deleting documents: ${error.message}`,
        module: 'Franchise-delete',
        filename: 'File-Upload',
        status: false,
      });
  
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        status: false,
        message: error.message || 'An unexpected error occurred while deleting the documents',
        deletedFiles: [],
        failedFiles: [],
      });
    }
  }
  
  

  
  
  

  @Get('get-image/:fileKey')
  async getImage(@Param('fileKey') fileKey: string, @Res() res) {
    try {
      // Generate the pre-signed URL using the file key
      const url = await this.fileUploadService.getPresignedUrl(fileKey);

      // Return the URL to the client
      return res.status(200).json({
        message: 'Image URL retrieved successfully',
        url,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Error retrieving image URL',
        error: error.message,
      });
    }
  }
  



  
  
}
