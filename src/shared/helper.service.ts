import { Injectable } from "@nestjs/common";
import { diskStorage } from 'multer';
import { extname,join } from 'path';
import { promises as fs } from 'fs';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class HelperService{

  
    constructor(){}


  async  uploadFilePath() {
    try{
        const rootPath = process.cwd(); // Gets the root path of the project
        const uploadPath = join(rootPath, 'uploads');
  // Ensure the directory exists before setting up Multer options
  await this.ensureDirectoryExistence(uploadPath);

        return {
          storage: diskStorage({
            destination: (req, file, callback) => {
                callback(null, uploadPath); // Use the dynamically created path
              }, // Path to store the file
            filename: (req, file, callback) => {
              // Create a unique filename
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              const ext = extname(file.originalname);
              const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
              callback(null, filename);
            },
          }),
        };   
    }catch(err){
        console.log("error during the uploading file",err)
    }
       
    }


    async ensureDirectoryExistence(dirPath: string) {
        try {
          await fs.access(dirPath);
        } catch (error) {
          // Directory does not exist, create it
          await fs.mkdir(dirPath, { recursive: true });
        }
      }


      getFilePath(filename: string): string {
        return `uploads/${filename}`
      }


      emailTemplate = (companyName: string, emailId: string, createPasswordLink: string) => `
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



   generateStrongPassword(length = 12) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
      let password = '';
      const bytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
          password += chars[bytes[i] % chars.length];
      }
      return password;
  }

  async hashPassword(plainPassword:any) {
    try {
      const hashedPassword = await argon2.hash(plainPassword);
      console.log(hashedPassword)
      return hashedPassword;
    } catch (err) {
      console.error('Error hashing password:', err);
      throw err;
    }
  }

   getFunctionNameFromStack(): string {
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



  
  
   
}