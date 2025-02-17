import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  
  @Injectable()
  export class CustomAuthGuard extends AuthGuard('jwt') {
    handleRequest(err, user, info, context: ExecutionContext) {
      if (err || !user) {
        throw (
          err || new UnauthorizedException('Custom error message: Unauthorized')
        );
      }
  
      // Add custom logic here, for example:
      // const request = context.switchToHttp().getRequest();
      // const customHeader = request.headers['x-custom-header'];
      // if (!customHeader || customHeader !== 'expectedValue') {
      //   throw new UnauthorizedException('Custom header missing or invalid');
      // }
  
      // You can also attach additional data to the request object
      // request.user = { ...user, customData: 'additional data' };
      
      return user;
    }
  }
  