import { AuthModel } from "@auth/models/auth.schema";
import { publishDirectMessage } from "@auth/queues/auth.producer";
import { authChannel } from "@auth/server";
import { firstLetterUppercase, IAuthBuyerMessageDetails, IAuthDocument, lowerCase } from "@edemuner/jobber-shared";
import { Model, Op } from "sequelize";
import { omit } from 'lodash';

export async function createAuthUser(data: IAuthDocument): Promise<IAuthDocument>{
    const result: Model = await AuthModel.create(data);
    const messageDetails: IAuthBuyerMessageDetails = {
        username: result.dataValues.username!,
        email: result.dataValues.email!,
        profilePicture: result.dataValues.profilePicture!,
        country: result.dataValues.country!,
        createdAt: result.dataValues.createdAt!,
        type: 'auth'
    };
    await publishDirectMessage(
        authChannel,
        'jobber-buyer-update',
        'user-buyer',
        JSON.stringify(messageDetails),
        'Buyer details sent to buyer service'
    );
    const userData: IAuthDocument = omit(result.dataValues, ['password']) as IAuthDocument;
    return userData;
}

export async function getAuthUserById(authId: number): Promise<IAuthDocument> {
    const user: Model = await AuthModel.findOne({
        where: { id: authId },
        attributes: {
            exclude: ['password']
        }
    }) as Model;

    return user.dataValues;
}

export async function getAuthUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDocument> {
    const user: Model = await AuthModel.findOne({
        where: {
            [Op.or]: [{username: firstLetterUppercase(username) }, { email: lowerCase(email) }]
         },
        attributes: {
            exclude: ['password']
        }
    }) as Model;

    return user.dataValues;
}

export async function getAuthUserByUsername(username: string): Promise<IAuthDocument> {
    const user: Model = await AuthModel.findOne({
        where: { username: firstLetterUppercase(username) },
        attributes: {
            exclude: ['password']
        }
    }) as Model;

    return user.dataValues;
}

export async function getAuthUserByEmail(email: string): Promise<IAuthDocument> {
    const user: Model = await AuthModel.findOne({
        where: { email: lowerCase(email) },
        attributes: {
            exclude: ['password']
        }
    }) as Model;

    return user.dataValues;
}

export async function getAuthUserByVerificationToken(token: string): Promise<IAuthDocument> {
    const user: Model = await AuthModel.findOne({
        where: { emailVerificationToken: lowerCase(token) },
        attributes: {
            exclude: ['password']
        }
    }) as Model;

    return user.dataValues;
}

export async function getAuthUserByPasswordToken(token: string): Promise<IAuthDocument> {
    const user: Model = await AuthModel.findOne({
        where: {
            [Op.and]: [{ passwordResetToken: token }, { passwordResetExpires: { [Op.gt]: new Date() }}]
         },
        attributes: {
            exclude: ['password']
        }
    }) as Model;

    return user.dataValues;
}
