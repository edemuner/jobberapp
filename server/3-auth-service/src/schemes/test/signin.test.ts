import { loginSchema } from '../signin';

describe('loginSchema', () => {
    it('passes when username is a plain username', () => {
        const { error } = loginSchema.validate({ username: 'edu123', password: 'pass1234' });

        expect(error).toBeUndefined();
    });

    it('passes when username is an email address', () => {
        const { error } = loginSchema.validate({ username: 'e@e.co', password: 'pass1234' });

        expect(error).toBeUndefined();
    });

    it('rejects an empty username with the plain-username message', () => {
        const { error } = loginSchema.validate({ username: '', password: 'pass1234' });

        expect(error?.details[0].message).toBe('Username is a required field');
    });

    it('rejects a username shorter than the minimum length', () => {
        const { error } = loginSchema.validate({ username: 'ab', password: 'pass1234' });

        expect(error?.details[0].message).toBe(' Invalid username');
    });

    it('rejects an empty password with the custom message', () => {
        const { error } = loginSchema.validate({ username: 'edu123', password: '' });

        expect(error?.details[0].message).toBe('password is a required field');
    });

    it('rejects a password longer than the maximum length', () => {
        const { error } = loginSchema.validate({ username: 'edu123', password: 'waytoolongpassword' });

        expect(error?.details[0].message).toBe(' Invalid password');
    });
});
