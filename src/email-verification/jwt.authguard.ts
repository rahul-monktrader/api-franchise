import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
   
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    const req = context.switchToHttp().getRequest();
  

    if (err || !user) {
   
      throw new UnauthorizedException('Invalid or expired token');
    }


    return user;
  }
}