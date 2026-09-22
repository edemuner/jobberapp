const mockAuthChannel = { name: 'auth-channel' };
const mockCreate = jest.fn();
const mockPublishDirectMessage = jest.fn();

jest.mock('@auth/models/auth.schema', () => ({
    AuthModel: { create: mockCreate }
}));
jest.mock('@auth/queues/auth.producer', () => ({
    publishDirectMessage: mockPublishDirectMessage
}));
jest.mock('@auth/server', () => ({
    authChannel: mockAuthChannel
}));

import { createAuthUser } from '../auth.service';
import { IAuthDocument } from '@edemuner/jobber-shared';

describe('createAuthUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
});
