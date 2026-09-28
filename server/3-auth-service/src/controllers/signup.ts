import { signupSchema } from "@auth/schemes/signup";
import { createAuthUser, getAuthUserByUsernameOrEmail, signToken } from "@auth/services/auth.service";
import { BadRequestError, firstLetterUppercase, IAuthDocument, IEmailMessageDetails, lowerCase, upload } from "@edemuner/jobber-shared";
import { UploadApiResponse } from "cloudinary";
import { Request, Response } from "express";
import { v4 as uuidV4 } from 'uuid';
import crypto from 'crypto';
import { jobberConfig } from "@auth/config";
import { publishDirectMessage } from "@auth/queues/auth.producer";
import { authChannel } from "@auth/server";
import { StatusCodes } from "http-status-codes";

export async function create(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(signupSchema.validate(req.body));
    if(error?.details){
        throw new BadRequestError(error.details[0].message, 'Signup create method error');
    }

    const { username, email, password, country, profilePicture } = req.body;
    const existingUser: IAuthDocument = await getAuthUserByUsernameOrEmail(username, email);
    if(existingUser){
        throw new BadRequestError('Invalid credentials. Email or user already exist', 'Signup create method error');
    }

    const profilePublicId = uuidV4();
    const uploadResult: UploadApiResponse = await upload(profilePicture, `${profilePublicId}`, true, true) as UploadApiResponse;
    if(!uploadResult.public_id){
        throw new BadRequestError('File upload error, try again', 'Signup create method error');
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    const authData: IAuthDocument = {
        username: firstLetterUppercase(username),
        email: lowerCase(email),
        profilePublicId,
        password,
        country,
        profilePicture: uploadResult.secure_url,
        emailVerificationToken: randomCharacters
    } as IAuthDocument;

    const result: IAuthDocument = await createAuthUser(authData);
    const verificationLink = `${jobberConfig.CLIENT_URL}/confirm_email?v_token=${authData.emailVerificationToken}`;
    const messageDetails: IEmailMessageDetails = {
        receiverEmail: result.email,
        verifyLink: verificationLink,
        template: 'verifyEmail'
    }
    await publishDirectMessage(
            authChannel,
            'jobber-email-notification',
            'auth-email',
            JSON.stringify(messageDetails),
            'Verify email message'
    );

    const userJWT: string = signToken(result.id!, result.email!, result.username!)

    res.status(StatusCodes.CREATED).json({ message: 'User created successfully', user: result, token: userJWT });
}
