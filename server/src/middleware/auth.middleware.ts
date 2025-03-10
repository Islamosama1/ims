/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../util/auth.util';
import { HttpError } from './error.middleware';
import { HttpStatus, UserTypeEnum } from '../types';
import { UserData } from '../persistance';
import { UserService } from '../services';
import Env from '../../config';

declare global {
  namespace Express {
    // Extends the Express Request interface to include a user proper
    // eslint-disable-next-line no-shadow
    interface Request {
      user?: any;
    }
  }
}

const isAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extracts the Authorization header from the request
    const authHeader = req.get('Authorization');
    const authType = authHeader?.split(' ')[0].toLowerCase();
    const authToken = authHeader?.replace(/[ ]+/, ' ').split(' ')[1];

    // Verifies the token using a custom function
    const user = verifyToken(authToken as string);

    // Checks if the token is valid and sets the user property of the request
    const isTokenValid = user && authType === 'bearer';
    console.log(Object(Object(user).user).id);
    if (isTokenValid) {
      if (Object(Object(user).user).id) {
        const userDataAccess = new UserData();
        const userService = new UserService(userDataAccess);
        const userdata = await userService.getById(Object(Object(user).user).id) ;
        req.user= {
          user:{
            ...userdata,type:userdata.type,id:userdata.id
          }
        }
        console.log('userData',req.user);
        //const payload = await userService.getByPayload(Object(Object(user).user).id);
        // req.user = {
        //   user: {
        //     ...payload, type: String(payload.type), id: String(payload.id), 
        //   },
        // };
        // console.log('user:',req.user);
      } else {
        req.user = { user: { type: UserTypeEnum.SADMIN, id: Env.SUPER_ADMIN_ID } };
      }
      // req.user = user;
      next();
    } else {
      throw new HttpError('Unauthorized user !!, Please Try to login first !!', HttpStatus.UNAUTHORIZED);
    }
  } catch {
    next(new HttpError(' Please Try to login first !!', HttpStatus.UNAUTHORIZED));
  }
};

export const hasValidRole = (
  roles: Array<string>,
) => (async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Checks if the user role is included in the array of valid roles and calls the next middleware function if it is
    if (!req.user || !req.user.user || !req.user.user.type) {
      throw new HttpError('User is not authenticated!', HttpStatus.UNAUTHORIZED);
    }

    const userType = req.user.user.type; // Extract user type for logging
    console.log('User Role:', userType); 
    console.log('Valid roles:', roles);

    
    console.log('Current user role before validation:', userType);

    if (roles.includes(userType)) {
      next();
    } else {
      throw new HttpError('You don not have permissions to access this area!', HttpStatus.FORBIDDEN);
    }
  } catch (error) {
    console.error('Authorization Error:', error);
    next(new HttpError('You don not have permissions to access this area!', HttpStatus.FORBIDDEN));
  }
});

export default isAuth;
