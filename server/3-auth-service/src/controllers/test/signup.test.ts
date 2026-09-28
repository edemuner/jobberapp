const mockValidate = jest.fn();
const mockGetAuthUserByUsernameOrEmail = jest.fn();
const mockUpload = jest.fn();
const mockUuidV4 = jest.fn();

jest.mock('@auth/schemes/signup', () => ({
    signupSchema: { validate: mockValidate }
}));
jest.mock('@auth/services/auth.service', () => ({
    getAuthUserByUsernameOrEmail: mockGetAuthUserByUsernameOrEmail
}));
jest.mock('@edemuner/jobber-shared', () => ({
    BadRequestError: class BadRequestError extends Error {
        constructor(message: string, stack: string) {
            super(message);
            this.name = stack;
        }
    },
    upload: mockUpload
}));
jest.mock('uuid', () => ({ v4: mockUuidV4 }));

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
const response = {} as any;

describe('signup controller', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockValidate.mockReturnValue({ error: undefined });
        mockUuidV4.mockReturnValue('profile-public-id');
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

        await expect(create(request, response)).resolves.toBeUndefined();

        expect(mockGetAuthUserByUsernameOrEmail).toHaveBeenCalledWith('alice', 'alice@example.com');
        expect(mockUpload).toHaveBeenCalledWith('profile-picture', 'profile-public-id', true, true);
    });
});
