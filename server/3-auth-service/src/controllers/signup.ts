import { signupSchema } from "@auth/schemes/signup";
import { getAuthUserByUsernameOrEmail } from "@auth/services/auth.service";
import { BadRequestError, IAuthDocument, upload } from "@edemuner/jobber-shared";
import { UploadApiResponse } from "cloudinary";
import { Request, Response } from "express";
import { v4 as uuidV4 } from 'uuid';

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
}