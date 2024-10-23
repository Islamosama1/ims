/* eslint-disable consistent-return */
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, isPasswordValid } from '../util/hashing';
// import upload from '../middleware/img.middleware';
import { signUser } from '../util/auth.util';
import Env from '../../config';
import {
 UserData,
} from '../persistance';
import mongoose, { Types } from 'mongoose'; 
import { HttpStatus, UserTypeEnum } from '../types';
import { generateEmail, sendEmail } from '../util/email.util';
import { HttpError } from '../middleware/error.middleware';
import { UserService } from '../services';

/**
 * @summary This class contain the middlewares that responsible for handle HTTP requests of User
 * @params Allof them receive the same arguments
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The next function to call in the middleware chain.
 * @throws {Error} If an error occurs during the create operation.
 * @returns {void} This function does not return anything.
 * */
class UserController {
  private userService: any;

  private projectUserService: any;

  private findingService: any;

  private scenarioService: any;

  private projectService: any;

  private clientService: any;

  private vrtService: any;

  private orgService: any;

  // Inject needed dependencies of User Service
  constructor() {
    const userDataAccess = new UserData();
    this.userService = new UserService(userDataAccess);
  }

  isValidEmail = async (orgId: string, email: string) => {
    const org = await this.orgService.getById(orgId);
    const orgDomain = `${org.org.domain}.${org.org.tld}`;
    const emailDomain = email.split('@')[1];
    console.log(`Emails: ${orgId} | ${orgDomain} | ${emailDomain}`);
    return orgDomain === emailDomain;
  };

  generateUser = (body: any, fileName: string | undefined,adminName?: string) => {
    console.log(`filename: ${fileName}`);
    if(fileName !== undefined){
      return {
        picture: fileName,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        mobile: body.mobile,
        type: body.type,
        orgId: body.orgId,
        clientId: body.clientId,
        passwordStatus: 'default',
        password: hashPassword(body.password),
        payload: uuidv4(),
        adminId: undefined,  
        teamLeaderId: undefined,
        createdByAdminName: adminName, 
      }
    }else {
      return {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        mobile: body.mobile,
        type: body.type,
        orgId: body.orgId,
        clientId: body.clientId,
        passwordStatus: 'default',
        password: hashPassword(body.password),
        payload: uuidv4(),
        adminId: undefined,  
        teamLeaderId: undefined,
        createdByAdminName: adminName, 
      }
    }
  };

  createFirstAdmin = async (req: Request, res: Response, next: NextFunction) => {
    console.log("Creating the first admin user...");
    
    try {
      const { firstName, email, password,payload ,mobile} = req.body; 
  
      // Validate that all required fields are provided
      if (!firstName || !email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).send({ message: 'Username, email, and password are required.' });
      }
  
      const adminData = {
        firstName,
        email,
        password,
        type: UserTypeEnum.ADMIN, 
        payload,
        mobile,
        // Use the appropriate enum value for admin
        // Include other necessary fields if required, like orgId or clientId
      };
  
      // Check if an admin already exists
      const existingAdmin = await this.userService.getByEmail(adminData.email);
      console.log('Existing admin:', existingAdmin);
      if (existingAdmin) {
        return res.status(HttpStatus.BAD_REQUEST).send({ message: 'Admin user already exists' });
      }
  
      // Create the new admin user
      const hashedPassword = hashPassword(adminData.password); // Hash the password
      await this.userService.create({ ...adminData, password: hashedPassword });
      
      return res.status(HttpStatus.CREATED).send({ message: 'First admin user created successfully' });
    } catch (e: any) {
      next(new HttpError(e.message || 'Failed to create the first admin user, please try again!', e.statusCode || 500));
    }
  };

      // Create User
  create = async (req: Request, res: Response, next: NextFunction) => {
    console.log('Adding trainee with data:', req.body);
    const { user } = req.user; 

     //if (!user || !user.user || !user.user.firstName) {
      // return next(new HttpError('User not authenticated!', HttpStatus.UNAUTHORIZED));
    // }
    console.log('Current user:', user);// Current user (Admin or Team Leader)
    try {
      const adminName = `${user.firstName} ${user.lastName || ''}`.trim() || 'Unknown Admin';

      const newUser = this.generateUser(req.body, req.file?.filename,adminName);
      console.log('User creating trainee:', user);
      if (user.type === UserTypeEnum.ADMIN || user.type === UserTypeEnum.SADMIN) {
        // Admin creating a user
        newUser.adminId = user.id; // Ensure the adminId is cast to ObjectId
        await this.userService.create({ ...newUser, adminId: user.id });
        return res.status(HttpStatus.CREATED).send({ message: 'User created successfully' });
      }

      if (user.type === UserTypeEnum.TEAMLEADER) {
        // Team Leader creating a trainee
        newUser.teamLeaderId = user.id;
        await this.userService.create({ ...newUser, teamLeaderId: user.id });
        return res.status(HttpStatus.CREATED).send({ message: 'Trainee created successfully' });
      }

      return res.status(HttpStatus.FORBIDDEN).send({ message: 'You do not have permission to create a user' });
    } catch (e: any) {
      next(new HttpError(e.message || 'Failed to add new User, please try again!', e.statusCode || 500));
    }
  };

  // Update User
  update = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // User ID to update
    const { user } = req.user; // Current user (Admin or Team Leader)

    try {
      const existingUser = await this.userService.getById(id);
      if (!existingUser) {
        return res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found' });
      }

      // Log the teamLeaderId of the existing user and the logged-in user's ID
      console.log('Existing User TeamLeaderId:', existingUser.teamLeaderId);
      console.log('Logged-in TeamLeader ID:', user.id);

      if (user.type === UserTypeEnum.ADMIN || user.type === UserTypeEnum.SADMIN || user.type === UserTypeEnum.TEAMLEADER) {
        await this.userService.updateById(id, req.body);
        return res.status(HttpStatus.OK).send({ message: 'User updated successfully' });
      }

      // if (user.type === UserTypeEnum.TEAMLEADER && existingUser.teamLeaderId === user.id) {
      //   await this.userService.updateById(id, req.body);
      //   return res.status(HttpStatus.OK).send({ message: 'Trainee updated successfully' });
      // }
      // Team Leader can only update their own trainees
      if (user.type === UserTypeEnum.TEAMLEADER) {
        console.log('Existing User TeamLeaderId:', existingUser.teamLeaderId);
        console.log('Logged-in TeamLeader ID:', user.id);

        // Ensure both are ObjectId instances before comparing
        if (existingUser.teamLeaderId && existingUser.teamLeaderId.equals(new Types.ObjectId(user.id))) {
          await this.userService.updateById(id, req.body);
          return res.status(HttpStatus.OK).send({ message: 'Trainee updated successfully' });
        } else {
          console.log('TeamLeader IDs do not match');
          return res.status(HttpStatus.FORBIDDEN).send({ message: 'You do not have permission to update this user' });
        }
      }

      return res.status(HttpStatus.FORBIDDEN).send({ message: 'You do not have permission to update this user' });
    } catch (e: any) {
      next(new HttpError(e.message || 'Failed to update User, please try again!', e.statusCode || 500));
    }
  };

  // Delete User
  delete = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // User ID to delete
    const { user } = req.user; // Current user (Admin or Team Leader)

    try {
      const existingUser = await this.userService.getById(id);
      if (!existingUser) {
        return res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found' });
      }
      // Log values for debugging
      console.log('Current user ID:', user.id);
      console.log('Existing User TeamLeader ID:', existingUser.teamLeaderId?.toString());

      if (user.type === UserTypeEnum.ADMIN || user.type === UserTypeEnum.SADMIN || user.type === UserTypeEnum.TEAMLEADER) {
        await this.userService.deleteById(id);
        return res.status(HttpStatus.OK).send({ message: 'User deleted successfully' });
      }
      
      // if (user.type === UserTypeEnum.TEAMLEADER && existingUser.teamLeaderId === user.id) {
      //   await this.userService.deleteById(id);
      //   return res.status(HttpStatus.OK).send({ message: 'Trainee deleted successfully' });
      // }

      return res.status(HttpStatus.FORBIDDEN).send({ message: 'You do not have permission to delete this user' });
    } catch (e: any) {
      next(new HttpError(e.message || 'Failed to delete User, please try again!', e.statusCode || 500));
    }
  };

  forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      const user = await this.userService.getByEmail(email);
      if (user) {
        const resetToken = uuidv4();
        await this.userService.updateResetTokenById(user.id, resetToken);
        const html = await generateEmail({
          name: user.firstName,
          resetToken,
          frontBaseUrl: Env.FRONTEND_BASE_URL,
        }, 'passwordReset');
        await sendEmail(
          { to: email, cc: ['emad.mohamedeng@gmail.com', 'emadcuster@gmail.com'] },
          { subject: 'Forget password', html },
        );
        return res.status(HttpStatus.OK).send({
          message: 'Reset Email sended successfully',
        });
      }
      throw new HttpError('Invalid email', HttpStatus.BAD_REQUEST);
    } catch (e: any) {
      next(new HttpError(e.message || 'Fail to send reset email, please try again!', e.statusCode || 500));
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { password, resetToken } = req.body;

      const user = await this.userService.getByToken(resetToken);
      if (user) {
        await this.userService.updateById(
          user.id,
          { password: hashPassword(password), resetToken: uuidv4() },
        );
        return res.status(HttpStatus.OK).send({
          message: 'Password updated successful',
        });
      }
      throw new HttpError('Invalid token', HttpStatus.BAD_REQUEST);
    } catch (e: any) {
      next(new HttpError(e.message || 'Fail to reset the password, please try again!', e.statusCode || 500));
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    const { body: { email, password } } = req;
    const { SUPER_ADMIN_USERNAME, SUPER_ADMIN_PASSWORD } = Env;
    console.log('Email:', email);
    try {
      // Check if the user is admin or not
      if (email === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
        const token = signUser({ });
        return res.status(HttpStatus.OK).send({
          message: 'Signin successfully',
          token,
        });
      }

      const user = await this.userService.getByEmail(email);
      console.log('User from DB:', user); 
      if (user && isPasswordValid(user.password as string, password)) {
        const token = signUser({  id: user.id, type: user.type }  );
        return res.status(HttpStatus.OK).send({
          message: 'Signin successfully',
          token,
        });
      }
      console.log('Provided Password:', password); 
    console.log('Stored Hashed Password:', user?.password); 
      throw new HttpError('Email and password not match, Please try again !!', HttpStatus.BAD_REQUEST);
    } catch (e: any) {
      console.log(e);
      next(new HttpError(e.message || 'Fail to login this Users, please try again!', e.statusCode || 500));
    }
  };
  getById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { user } = req.user;
    try {
      const userDetails = await this.userService.getById(id);
        return res.status(HttpStatus.OK).send({
          message: 'User got successfully',
          user: {
            user: userDetails,
          },
        });
    } catch (e: any) {
      next(new HttpError(e.message || 'Fail to get the User, please try again!', e.statusCode || 500));
    }
  };
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req.user;
    try{
      const users = await this.userService.getAll();
      return res.status(HttpStatus.OK).send({
        message: 'User got successfully',
        users: users,
      });
    }catch (e: any) {
      next(new HttpError(e.message || 'Fail to get the User, please try again!', e.statusCode || 500));
    }
    
    
  }
}

export default new UserController();
