const mockAuthChannel = { name: 'auth-channel' };
const mockCreate = jest.fn();
const mockFindOne = jest.fn();
const mockUpdate = jest.fn();
const mockPublishDirectMessage = jest.fn();
const mockSign = jest.fn();

jest.mock('@auth/models/auth.schema', () => ({
    AuthModel: { create: mockCreate, findOne: mockFindOne, update: mockUpdate }
}));
jest.mock('@auth/queues/auth.producer', () => ({
    publishDirectMessage: mockPublishDirectMessage
}));
jest.mock('@auth/server', () => ({
    authChannel: mockAuthChannel
}));
jest.mock('jsonwebtoken', () => ({ sign: mockSign }));

import {
    createAuthUser,
    getAuthUserByEmail,
    getAuthUserById,
    getAuthUserByPasswordToken,
    getAuthUserByUsername,
    getAuthUserByUsernameOrEmail,
    getAuthUserByVerificationToken,
    signToken,
    updatePassword,
    updatePasswordToken,
    updateVerifyEmailField
} from '../auth.service';
import { IAuthDocument } from '@edemuner/jobber-shared';
import { Op } from 'sequelize';

describe('createAuthUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const user = { dataValues: { id: 7, username: 'Alice', email: 'alice@example.com' } };

    beforeEach(() => {
        mockFindOne.mockResolvedValue(user);
    });

    it('creates a user, publishes buyer details, and omits the password from the response', async () => {
        const data = {
            username: 'alice',
            password: 'password',
            email: 'alice@example.com',
            country: 'US',
            profilePicture: 'alice-picture'
        } as IAuthDocument;
        const createdUser = {
            dataValues: {
                ...data,
                profilePublicId: 'public-id',
                emailVerified: 0,
                createdAt: new Date('2026-01-01T00:00:00.000Z')
            }
        };
        mockCreate.mockResolvedValueOnce(createdUser);
        mockPublishDirectMessage.mockResolvedValueOnce(undefined);

        const result = await createAuthUser(data);

        expect(mockCreate).toHaveBeenCalledWith(data);
        expect(mockPublishDirectMessage).toHaveBeenCalledWith(
            mockAuthChannel,
            'jobber-buyer-update',
            'user-buyer',
            JSON.stringify({
                username: 'alice',
                email: 'alice@example.com',
                profilePicture: 'alice-picture',
                country: 'US',
                createdAt: createdUser.dataValues.createdAt,
                type: 'auth'
            }),
            'Buyer details sent to buyer service'
        );
        expect(result).toEqual({
            username: 'alice',
            email: 'alice@example.com',
            country: 'US',
            profilePicture: 'alice-picture',
            profilePublicId: 'public-id',
            emailVerified: 0,
            createdAt: createdUser.dataValues.createdAt
        });
        expect(result).not.toHaveProperty('password');
    });

    it('finds an auth user by id without selecting the password', async () => {
        const result = await getAuthUserById(7);

        expect(result).toBe(user.dataValues);
        expect(mockFindOne).toHaveBeenCalledWith({
            where: { id: 7 },
            attributes: { exclude: ['password'] }
        });
    });

    it('finds an auth user by normalized username or email', async () => {
        await getAuthUserByUsernameOrEmail('ALICE', 'ALICE@EXAMPLE.COM');

        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { username: 'Alice' },
                    { email: 'alice@example.com' }
                ]
            },
            attributes: { exclude: ['password'] }
        });
    });

    it('finds an auth user by normalized username', async () => {
        await getAuthUserByUsername('ALICE');

        expect(mockFindOne).toHaveBeenCalledWith({
            where: { username: 'Alice' },
            attributes: { exclude: ['password'] }
        });
    });

    it('finds an auth user by normalized email', async () => {
        await getAuthUserByEmail('ALICE@EXAMPLE.COM');

        expect(mockFindOne).toHaveBeenCalledWith({
            where: { email: 'alice@example.com' },
            attributes: { exclude: ['password'] }
        });
    });

    it('finds an auth user by normalized verification token', async () => {
        await getAuthUserByVerificationToken('TOKEN');

        expect(mockFindOne).toHaveBeenCalledWith({
            where: { emailVerificationToken: 'token' },
            attributes: { exclude: ['password'] }
        });
    });

    it('finds an auth user by an active password reset token', async () => {
        const beforeCall = new Date();

        await getAuthUserByPasswordToken('reset-token');

        const afterCall = new Date();
        const query = mockFindOne.mock.calls[0][0];
        const expiry = query.where[Op.and][1].passwordResetExpires[Op.gt] as Date;

        expect(query.where[Op.and][0]).toEqual({ passwordResetToken: 'reset-token' });
        expect(expiry.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
        expect(expiry.getTime()).toBeLessThanOrEqual(afterCall.getTime());
        expect(query.attributes).toEqual({ exclude: ['password'] });
    });
});

describe('auth user updates', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('updates the email verification fields', async () => {
        mockUpdate.mockResolvedValueOnce([1]);

        await updateVerifyEmailField(7, 1, 'verification-token');

        expect(mockUpdate).toHaveBeenCalledWith(
            { emailVerified: 1, emailVerificationToken: 'verification-token' },
            { where: { id: 7 } }
        );
    });

    it('updates the password reset token and expiry', async () => {
        const expiration = new Date('2026-02-01T00:00:00.000Z');
        mockUpdate.mockResolvedValueOnce([1]);

        await updatePasswordToken(7, 'reset-token', expiration);

        expect(mockUpdate).toHaveBeenCalledWith(
            { passwordResetToken: 'reset-token', passwordResetExpires: expiration },
            { where: { id: 7 } }
        );
    });

    it('updates the password and clears the reset token', async () => {
        mockUpdate.mockResolvedValueOnce([1]);

        await updatePassword(7, 'new-password', new Date('2026-02-01T00:00:00.000Z'));

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                password: 'new-password',
                passwordResetToken: ''
            }),
            { where: { id: 7 } }
        );
        expect(mockUpdate.mock.calls[0][0].passwordResetExpires).toBeInstanceOf(Date);
    });
});

describe('signToken', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSign.mockReturnValue('signed-token');
    });

    it('signs the auth payload with the configured JWT secret', () => {
        expect(signToken(7, 'alice@example.com', 'Alice')).toBe('signed-token');

        expect(mockSign).toHaveBeenCalledWith(
            { id: 7, email: 'alice@example.com', userName: 'Alice' },
            expect.any(String)
        );
    });
});
