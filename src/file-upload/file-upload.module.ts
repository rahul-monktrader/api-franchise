import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { EmailVerificationModule } from 'src/email-verification/email-verification.module';
import { FranchiseModule } from 'src/franchise/franchise.module';

@Module({
  controllers: [FileUploadController],
  providers: [FileUploadService],
  imports: [EmailVerificationModule,FranchiseModule],
})
export class FileUploadModule {}
