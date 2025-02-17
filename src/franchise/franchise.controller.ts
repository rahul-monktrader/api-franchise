import { Controller, Put, Param, Body, Res, HttpStatus, UseGuards,Request, HttpException, Get, Req, Post } from '@nestjs/common';
import { Response } from 'express';
import { FranchiseService } from './franchise.service';
import { JwtAuthGuard } from 'src/email-verification/jwt.authguard';
import { CustomAuthGuard } from 'src/email-verification/auth.guard';
import { sendSlackMessage } from 'src/shared/slack.util';

@Controller('franchisee')
export class FranchiseeController {

  constructor(private readonly franchiseeService: FranchiseService) {}
  /*
  @Post('accept-or-reject')

  async acceptOrRejectFranchise(
    @Body() action: { status: 'accept' | 'reject'; franchise_code: string },
    @Res() res: Response,
    @Request() req, // Access the user details from the request
  ) {
    try {
        const { franchise_code } = action;
      
        // Get franchiseId using the franchise_code from the service
        const userFranchiseId = await this.franchiseeService.getFranchiseIdByCode(franchise_code);
  
      if (!userFranchiseId) {
        return res.status(HttpStatus.OK).json({
          message: 'Franchise ID is missing for the user.',
          statusCode: HttpStatus.OK,
          status: false,
        });
      }
  
      const result = await this.franchiseeService.handleFranchiseAction(Number(userFranchiseId), action.status,);
  
      if (result.status === 'success') {

        
        return res.status(HttpStatus.OK).json({
          message: action.status === 'accept' ? 'Franchise accepted and coupon created.' : 'Franchise rejected.',
          status: true,
          statusCode: HttpStatus.OK,
        });
      }
  
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Unable to process the action, please try again.',
        statusCode: HttpStatus.BAD_REQUEST,
        status: false,
      });
  
    } catch (error) {
      console.error('Error processing franchise action:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'An error occurred while processing the franchise action.',
        status: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

*/
@Get('details')
@UseGuards(JwtAuthGuard) // Protect this route with the JWT Guard
async getFranchiseDetails(@Request() req, @Res() res: Response) {
  try {
    const franchiseeId = req.user.franchiseId;

    // Call the service to get the franchise details
    const franchiseDetails = await this.franchiseeService.getFranchiseDetailsById(franchiseeId);

    if (!franchiseDetails) {
      return res.status(HttpStatus.OK).json({
        message: 'Details not found for franchiseId.',
        statusCode: HttpStatus.OK,
        status: false,
        data: [],
      });
    }

    return res.status(HttpStatus.OK).json({
      message: 'Details for franchiseID',
      statusCode: HttpStatus.OK,
      status: true,
      data: franchiseDetails,
    });
  } catch (error) {
    // Handle unexpected errors here
    console.error('Error fetching franchise details:', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'An error occurred while fetching franchise details.',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      status: false,
      error: error.message || error,
    });
  }
}


}
