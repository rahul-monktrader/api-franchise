import { Controller, Post, Body, BadRequestException, UnauthorizedException, UseGuards, Param, Res, HttpStatus, HttpException, Req, Get } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { AdminUser } from './admin-user.model'; // Sequelize Model
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './role.guard';
import { Roles } from './roles.decorator';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from './jwt.auth.guard';
import { FranchiseService } from 'src/franchise/franchise.service';
import { Request, Response } from 'express'; // Correct import
import { sendSlackMessage } from 'src/shared/slack.util';
@Controller('admin-users')
export class AdminUsersController {
  constructor(
    @InjectModel(AdminUser) private readonly adminUserModel: typeof AdminUser,
    private readonly jwtService: JwtService,
    private readonly adminUsersService: AdminUsersService,
    private readonly franchiseService: FranchiseService
  ) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }, @Res() res) {
    try {
      const { username, password } = body;
  
      // Check if username and password are the same
      if (username === password) {
        return res.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          status: false,
          message: 'Username & password should not be the same.',
        });
      }
  
      // Call the login method from the service
      const { user, isNewUser } = await this.adminUsersService.login(username, password);
  
      // If user is new, validate password rules
      if (isNewUser) {
        // Check if password meets the complexity requirements for a new user
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
          return res.status(HttpStatus.OK).json({
            statusCode: HttpStatus.OK,
            status: false,
            message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.',
          });
        }
  
        // Notify admin about the new user needing approval
        await sendSlackMessage({
          message: `Username ${username} needs admin access`,
          module: 'Admin',
          filename: 'admin-users',
          status: true,
        });
  
        return res.status(HttpStatus.OK).json({
          statusCode: 200,
          status: false,
          message: 'Account created, awaiting SUPER_ADMIN approval',
        });
      }
  
      // If no user found, return response indicating invalid credentials
      if (!user) {
        return res.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          status: false,
          message: 'Invalid credentials',
        });
      }
  
      // If user status is 'PENDING', deny access
      if (user.status === 'PENDING') {
        return res.status(HttpStatus.OK).json({
          statusCode: 200,
          status: false,
          message: 'Your account is pending approval',
        });
      }
  
      // If user status is 'REJECTED', deny access
      if (user.status === 'REJECTED') {
        return res.status(HttpStatus.OK).json({
          statusCode: 200,
          status: false,
          message: 'Your account has been rejected',
        });
      }
  
      // Validate the password for existing users
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          status: false,
          message: 'Invalid password',
        });
      }
  
      // Generate JWT token for valid users
      const token = this.adminUsersService.generateToken(user);
      res.setHeader('Authorization', `Bearer ${token}`);
      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        status: true,
        message: `Login successful as ${user.role}`,
        role: user.role,
      });
  
    } catch (error) {
      console.error('Error during login:', error);
  
      // Send error details to Slack
      await sendSlackMessage({
        message: `Login failed for username ${body.username}. Error: ${error.message}`,
        module: 'Admin',
        filename: 'admin-users',
        status: false,
      });
  
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        status: false,
        message: 'An error occurred during login. Please try again later.',
      });
    }
  }
  
  



  
@Post(':action/:username') // Supports both approve & reject actions
@Roles('SUPER_ADMIN') // Only SUPER_ADMIN can access this route
async approveOrRejectAdmin(
  @Param('action') action: string,
  @Param('username') username: string,
  @Req() req: Request,
  @Res() res
) {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header

  if (!token) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      statusCode: 401,
      status: false,
      message: 'Token not provided',
    });
  }

  try {
    // Verify token
    const decoded = await this.jwtService.verifyAsync(token);

    // Ensure only SUPER_ADMIN can approve or reject
    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(HttpStatus.FORBIDDEN).json({
        statusCode: 403,
        status: false,
        message: 'Forbidden: Only SUPER_ADMIN can manage approvals',
      });
    }

    // Validate action type
    if (action !== 'approve' && action !== 'reject') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        status: false,
        message: 'Invalid action. Use "approve" or "reject".',
      });
    }

    // Process the approval or rejection
    const result = await this.adminUsersService.approveOrRejectAdmin(username, action);

    if (result === 'NOT_FOUND') {
      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        status: false,
        message: `User ${username} not found`,
      });
    }

    if (result === 'ALREADY_APPROVED' || result === 'ALREADY_REJECTED') {
      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        status: false,
        message: `User ${username} is already ${result === 'ALREADY_APPROVED' ? 'approved' : 'rejected'}`,
      });
    }

    // Send Slack alert for approval/rejection
    await sendSlackMessage({
      message: `Admin user ${username} has been ${action.toUpperCase()}D by SUPER_ADMIN`,
      module: 'Admin',
      filename: 'admin-users',
      status: true,
    });

    return res.status(HttpStatus.OK).json({
      statusCode: 200,
      status: true,
      message: `Admin user ${username} ${action}d successfully`,
    });

  } catch (error) {
    console.error('Error processing admin approval/rejection:', error);

    // Handle JWT errors
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: 401,
        status: false,
        message: 'Invalid or expired token',
      });
    }

    // Log to Slack on failure
    await sendSlackMessage({
      message: `Admin ${action} failed for username ${username}. Error: ${error.message}`,
      module: 'Admin',
      filename: 'admin-users',
      status: false,
    });

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      status: false,
      message: 'Internal server error',
    });
  }
}

  
  
  

  @Get('status/:status') // Example: /admin-users/status/pending or /admin-users/status/approved
@Roles('SUPER_ADMIN') // Only SUPER_ADMIN can access this route
async getUsersByStatus(@Param('status') status: string, @Req() req: Request, @Res() res) {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header

  if (!token) {
    return res.status(HttpStatus.OK).json({
      statusCode: 200,
      status: false,
      message: 'Token not provided',
    });
  }

  try {
    // Verify token
    const decoded = await this.jwtService.verifyAsync(token);
    
    // Ensure only SUPER_ADMIN can fetch the data
    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        status: false,
        message: 'Forbidden: Only SUPER_ADMIN can access this',
      });
    }

    // Validate status input (should be 'pending' or 'approved')
    if (!['pending', 'approved','rejected'].includes(status.toLowerCase())) {
      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        status: false,
        message: 'Invalid status. Allowed values: pending, approved',
      });
    }

    // Fetch users based on status
    const users = await this.adminUsersService.getUsersByStatus(status.toUpperCase());

    return res.status(HttpStatus.OK).json({
      statusCode: 200,
      status: true,
      message: `Fetched ${users.length} ${status} users successfully`,
      data: users,
    });

  } catch (error) {
    console.log(error)
    return res.status(HttpStatus.OK).json({
      statusCode: 200,
      status: false,
      message: 'Invalid or expired token',
    });
  }
}

@Post('logout')
  async logout(@Req() req: Request, @Res() res) {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header

    if (!token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: 401,
        message: 'No token provided',
      });
    }

    try {
      // Add the token to the blacklist to invalidate it
      await this.adminUsersService.blacklistToken(token);

      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        message: 'Successfully logged out',
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        message: 'Error logging out',
      });
    }
  }



  @Post('accept-or-reject')
  
    async acceptOrRejectFranchise(
      @Body() action: { status: 'accept' | 'reject'; franchise_id: string },
      @Res() res,
      @Req() req: Request, // Access the user details from the request
    ) {
      try {
          const { franchise_id } = action;
          const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
          if (!token) {
            return res.status(HttpStatus.OK).json({
              statusCode: 200,
              status: false,
              message: 'Token not provided',
            });
          }

          const decoded = await this.jwtService.verifyAsync(token);
         
      // Extract user_id from decoded token (assuming it's in the token payload)
      const userId = decoded?.id;
          // Get franchiseId using the franchyise_code from the service
          const userFranchiseId = await this.franchiseService.getFranchiseDetailsById(Number(franchise_id));
        if (!userFranchiseId) {
          return res.status(HttpStatus.OK).json({
            message: 'Franchise ID is missing for the user.',
            statusCode: HttpStatus.OK,
            status: false,
          });
        }


        const franchiseStatus = await this.franchiseService.getFranchiseDetailsById(Number(franchise_id));
        if (franchiseStatus && franchiseStatus.status === 'success') {
          return res.status(HttpStatus.OK).json({
            statusCode: 200,
            status: false,
            message: 'Franchise already accepted. Action cannot be performed.',
          });
        }
    
        if (franchiseStatus && franchiseStatus.status === 'rejected') {
          return res.status(HttpStatus.OK).json({
            statusCode: 200,
            status: false,
            message: 'Franchise already rejected. Action cannot be performed.',
          });
        }
        const result = await this.franchiseService.handleFranchiseAction(Number(franchiseStatus?.franchisee_id), action.status,userId);
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
        await sendSlackMessage({
          message: `'An error occurred while processing the franchise action. ${error.message}`,
          module: 'Admin',
          filename: 'get-franchises',
          status: false,
        });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'An error occurred while processing the franchise action.',
          status: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }
    }


    @Get('get-franchises')
    async getAllFranchises(@Res() res, @Req() req: Request) {
      try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) {
          return res.status(HttpStatus.OK).json({
            statusCode: 200,
            status: false,
            message: 'Token not provided',
          });
        }
    
        // Extract 'status' from query parameters and ensure it's a string
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    
        // Fetch franchises with optional filtering by status
        const franchises = await this.adminUsersService.getAllFranchises(status);
    
        return res.status(200).json({
          status: 200,
          message: 'Franchises retrieved successfully',
          data: franchises,
          statusCode:200
        });
      } catch (error) {
        await sendSlackMessage({
          message: `Error fetching franchisese Error: ${error.message}`,
          module: 'Admin',
          filename: 'get-franchises',
          status: false,
        });
        return res.status(500).json({
          status: 'error',
          message: 'Error fetching franchises',
          error: error.message,
          data:[]
        });
      }
    }
    

    

}
