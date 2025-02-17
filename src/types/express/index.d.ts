import { Request } from 'express';

// Extend the Request interface to include a 'token' property
declare global {
  namespace Express {
    interface Request {
      token?: string; // Make 'token' optional since it may not always be present
    }
  }
}
