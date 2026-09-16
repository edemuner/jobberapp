import { signupSchema } from '../signup';

const validPayload = {
    username: 'edu123',
    password: 'pass1234',
    country: 'Brazil',
    email: 'e@e.co',
    profilePicture: 'http://pic'
};

describe('signupSchema', () => {
    it('passes for a well-formed payload', () => {
        const { error } = signupSchema.validate(validPayload);

        expect(error).toBeUndefined();
    });

    it('rejects an empty username with the custom message', () => {
        const { error } = signupSchema.validate({ ...validPayload, username: '' });

        expect(error?.details[0].message).toBe('Username is a required field');
    });

    it('rejects a username shorter than the minimum length', () => {
        const { error } = signupSchema.validate({ ...validPayload, username: 'ab' });

        expect(error?.details[0].message).toBe(' Invalid username');
    });

    it('rejects an empty password with the custom message', () => {
        const { error } = signupSchema.validate({ ...validPayload, password: '' });

        expect(error?.details[0].message).toBe('password is a required field');
    });

    it('rejects a password longer than the maximum length', () => {
        const { error } = signupSchema.validate({ ...validPayload, password: 'waytoolongpassword' });

        expect(error?.details[0].message).toBe(' Invalid password');
    });

    it('rejects an empty country with the custom message', () => {
        const { error } = signupSchema.validate({ ...validPayload, country: '' });

        expect(error?.details[0].message).toBe('country is a required field');
    });

    it('rejects a malformed email with the custom message', () => {
        const { error } = signupSchema.validate({ ...validPayload, email: 'not-an-email' });

        expect(error?.details[0].message).toBe(' Invalid email');
    });

    it('rejects an empty email with the custom message', () => {
        const { error } = signupSchema.validate({ ...validPayload, email: '' });

        expect(error?.details[0].message).toBe('email is a required field');
    });

    it('rejects an empty profilePicture with the custom message', () => {
        const { error } = signupSchema.validate({ ...validPayload, profilePicture: '' });

        expect(error?.details[0].message).toBe('profile picture is a required field');
    });

    it('rejects a payload missing a required field entirely', () => {
        const { username, ...rest } = validPayload;

        const { error } = signupSchema.validate(rest);

        expect(error?.details[0].message).toBe('"username" is required');
    });
});
