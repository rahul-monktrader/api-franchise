import { IsString, Matches, IsNotEmpty } from 'class-validator';

export class UploadDocumentsDto {
  // Aadhar Front
  @IsString()
  @IsNotEmpty()
  @Matches(/^data:image\/(png|jpeg|jpg);base64,/, {
    message: 'Invalid file format. Only PNG, JPEG, or JPG files are allowed in base64 format.',
  })
  @IsNotEmpty({ message: 'Aadhar front is required.' })
  aadharfront: string;

  // Aadhar Back
  @IsString()
  @IsNotEmpty()
  @Matches(/^data:image\/(png|jpeg|jpg);base64,/, {
    message: 'Invalid file format. Only PNG, JPEG, or JPG files are allowed in base64 format.',
  })
  @IsNotEmpty({ message: 'Aadhar back is required.' })
  aadharBack: string;

  // Pan Card
  @IsString()
  @IsNotEmpty()
  @Matches(/^data:image\/(png|jpeg|jpg);base64,/, {
    message: 'Invalid file format. Only PNG, JPEG, or JPG files are allowed in base64 format.',
  })
  @IsNotEmpty({ message: 'Pan card is required.' })
  panCard: string;
}
