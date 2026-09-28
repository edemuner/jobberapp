const mockValidate = jest.fn();
const mockGetAuthUserByUsernameOrEmail = jest.fn();
const mockCreateAuthUser = jest.fn();
const mockSignToken = jest.fn();
const mockUpload = jest.fn();
const mockUuidV4 = jest.fn();
const mockRandomBytes = jest.fn();
const mockPublishDirectMessage = jest.fn();
const mockAuthChannel = { name: 'auth-channel' };

jest.mock('@auth/schemes/signup', () => ({
    signupSchema: { validate: mockValidate }
}));
jest.mock('@auth/services/auth.service', () => ({
    createAuthUser: mockCreateAuthUser,
    getAuthUserByUsernameOrEmail: mockGetAuthUserByUsernameOrEmail,
    signToken: mockSignToken
}));
jest.mock('@auth/queues/auth.producer', () => ({
    publishDirectMessage: mockPublishDirectMessage
}));
jest.mock('@auth/server', () => ({
    authChannel: mockAuthChannel
}));
jest.mock('@auth/config', () => ({
    jobberConfig: { CLIENT_URL: 'https://client.test' }
}));
jest.mock('@edemuner/jobber-shared', () => ({
    BadRequestError: class BadRequestError extends Error {
        constructor(message: string, stack: string) {
            super(message);
            this.name = stack;
        }
    },
    firstLetterUppercase: (value: string) => value[0].toUpperCase() + value.slice(1),
    lowerCase: (value: string) => value.toLowerCase(),
    upload: mockUpload
}));
jest.mock('uuid', () => ({ v4: mockUuidV4 }));
jest.mock('crypto', () => ({ randomBytes: mockRandomBytes }));

import { create } from '../signup';

const request = {
    body: {
        username: 'alice',
        email: 'alice@example.com',
        password: 'password',
        country: 'Canada',
        profilePicture: 'profile-picture'
    }
} as any;
const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
} as any;

describe('signup controller', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockValidate.mockReturnValue({ error: undefined });
        mockUuidV4.mockReturnValue('profile-public-id');
        mockRandomBytes.mockReturnValue(Buffer.from('verification-bytes'));
        response.status.mockReturnValue(response);
    });

    it('rejects an invalid signup payload', async () => {
        mockValidate.mockReturnValue({ error: { details: [{ message: 'Invalid signup' }] } });

        await expect(create(request, response)).rejects.toMatchObject({
            message: 'Invalid signup',
            name: 'Signup create method error'
        });
        expect(mockGetAuthUserByUsernameOrEmail).not.toHaveBeenCalled();
    });

    it('rejects a signup when the username or email already exists', async () => {
        mockGetAuthUserByUsernameOrEmail.mockResolvedValueOnce({ id: 7 });

        await expect(create(request, response)).rejects.toMatchObject({
            message: 'Invalid credentials. Email or user already exist',
            name: 'Signup create method error'
        });
        expect(mockGetAuthUserByUsernameOrEmail).toHaveBeenCalledWith('alice', 'alice@example.com');
        expect(mockUpload).not.toHaveBeenCalled();
    });

    it('rejects a signup when the profile upload has no public id', async () => {
        mockGetAuthUserByUsernameOrEmail.mockResolvedValueOnce(undefined);
        mockUpload.mockResolvedValueOnce({});

        await expect(create(request, response)).rejects.toMatchObject({
            message: 'File upload error, try again',
            name: 'Signup create method error'
        });
        expect(mockUpload).toHaveBeenCalledWith('profile-picture', 'profile-public-id', true, true);
    });

    it('uploads a profile picture for a new signup', async () => {
        mockGetAuthUserByUsernameOrEmail.mockResolvedValueOnce(undefined);
        mockUpload.mockResolvedValueOnce({ public_id: 'uploaded-profile-id' });
        mockCreateAuthUser.mockResolvedValueOnce({
            id: 7,
            username: 'Alice',
            email: 'alice@example.com'
        });
        mockSignToken.mockReturnValueOnce('user-jwt');

        await create(request, response);

        expect(mockGetAuthUserByUsernameOrEmail).toHaveBeenCalledWith('alice', 'alice@example.com');
        expect(mockUpload).toHaveBeenCalledWith('profile-picture', 'profile-public-id', true, true);
        expect(mockCreateAuthUser).toHaveBeenCalledWith({
            username: 'Alice',
            email: 'alice@example.com',
            profilePublicId: 'profile-public-id',
            password: 'password',
            country: 'Canada',
            profilePicture: undefined,
            emailVerificationToken: Buffer.from('verification-bytes').toString('hex')
        });
        expect(mockPublishDirectMessage).toHaveBeenCalledWith(
            mockAuthChannel,
            'jobber-email-notification',
            'auth-email',
            JSON.stringify({
                receiverEmail: 'alice@example.com',
                verifyLink: 'https://client.test/confirm_email?v_token=766572696669636174696f6e2d6279746573',
                template: 'verifyEmail'
            }),
            'Verify email message'
        );
        expect(mockSignToken).toHaveBeenCalledWith(7, 'alice@example.com', 'Alice');
        expect(response.status).toHaveBeenCalledWith(201);
        expect(response.status().json).toHaveBeenCalledWith({
            message: 'User created successfully',
            user: { id: 7, username: 'Alice', email: 'alice@example.com' },
            token: 'user-jwt'
        });
    });

    it('stores the secure profile URL returned by the upload service', async () => {
        mockGetAuthUserByUsernameOrEmail.mockResolvedValueOnce(undefined);
        mockUpload.mockResolvedValueOnce({
            public_id: 'uploaded-profile-id',
            secure_url: 'https://cdn.test/profile.jpg'
        });
        mockCreateAuthUser.mockResolvedValueOnce({
            id: 7,
            username: 'Alice',
            email: 'alice@example.com'
        });
        mockSignToken.mockReturnValueOnce('user-jwt');

        await create(request, response);

        expect(mockCreateAuthUser).toHaveBeenCalledWith(expect.objectContaining({
            profilePicture: 'https://cdn.test/profile.jpg'
        }));
    });
});
