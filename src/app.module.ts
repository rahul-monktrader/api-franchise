import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FranchiseModule } from './franchise/franchise.module';
import { FranchiseeController } from './franchise/franchise.controller';
import { EmailVerificationModule } from './email-verification/email-verification.module';
import { EmailVerificationController } from './email-verification/email-verification.controller';
import { DatabaseModule } from './database/database.module';
import { HelperService } from './shared/helper.service';
import { ConfigModule } from '@nestjs/config';
import { FileUploadModule } from './file-upload/file-upload.module';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static'; // Import ServeStaticModule
import { join } from 'path';  // Import join from path
import { AdminUsersModule } from './admin-users/admin-users.module';

@Module({
  imports: [
    FranchiseModule,
    EmailVerificationModule,
    DatabaseModule,
    ConfigModule.forRoot(),
    FileUploadModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use your JWT secret
      signOptions: { expiresIn: '1h' }, // Adjust expiration as needed
    }),
    // Serve static files from src/uploads
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src', 'uploads'), // Serve from src/uploads
      serveRoot: '/uploads',  // Make files accessible under the /uploads path
    }),
    AdminUsersModule,
  ],
  controllers: [AppController, FranchiseeController, EmailVerificationController],
  providers: [AppService, HelperService],
})
export class AppModule {}
