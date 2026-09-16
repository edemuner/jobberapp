import { emailSchema, passwordSchema, changePasswordSchema } from '../passwords';

describe('emailSchema', () => {
    it('passes for a valid email', () => {
        const { error } = emailSchema.validate({ email: 'e@e.co' });

        expect(error).toBeUndefined();
    });

    it('rejects a malformed email with the custom message', () => {
        const { error } = emailSchema.validate({ email: 'not-an-email' });

        expect(error?.details[0].message).toBe('Field must be valid');
    });
});

describe('passwordSchema', () => {
    it('passes when confirmPassword matches password', () => {
        const { error } = passwordSchema.validate({ password: 'pass1234', confirmPassword: 'pass1234' });

        expect(error).toBeUndefined();
    });

    it('rejects when confirmPassword does not match password', () => {
        const { error } = passwordSchema.validate({ password: 'pass1234', confirmPassword: 'other123' });

        expect(error?.details[0].message).toBe('Passwords should match');
    });

    it('rejects an empty password with the custom message', () => {
        const { error } = passwordSchema.validate({ password: '', confirmPassword: 'pass1234' });

        expect(error?.details[0].message).toBe('Password is a required field');
    });

    it('rejects a password longer than the maximum length', () => {
        const { error } = passwordSchema.validate({ password: 'waytoolongpassword', confirmPassword: 'waytoolongpassword' });

        expect(error?.details[0].message).toBe('Invalid password');
    });

    it('rejects a missing confirmPassword with the custom message', () => {
        const { error } = passwordSchema.validate({ password: 'pass1234' });

        expect(error?.details[0].message).toBe('Confirm password is a required field');
    });
});

describe('changePasswordSchema', () => {
    it('passes when newPassword differs from currentPassword', () => {
        const { error } = changePasswordSchema.validate({ currentPassword: 'oldpass1', newPassword: 'newpass1' });

        expect(error).toBeUndefined();
    });

    it('rejects when newPassword is the same as currentPassword', () => {
        const { error } = changePasswordSchema.validate({ currentPassword: 'samepass', newPassword: 'samepass' });

        expect(error?.details[0].message).toBe('New password must be different from the current password');
    });

    it('rejects an empty currentPassword with the custom message', () => {
        const { error } = changePasswordSchema.validate({ currentPassword: '', newPassword: 'newpass1' });

        expect(error?.details[0].message).toBe('Password is a required field');
    });

    it('rejects a currentPassword longer than the maximum length', () => {
        const { error } = changePasswordSchema.validate({ currentPassword: 'waytoolong', newPassword: 'newpass1' });

        expect(error?.details[0].message).toBe('Invalid password');
    });

    it('rejects a missing newPassword with the custom message', () => {
        const { error } = changePasswordSchema.validate({ currentPassword: 'oldpass1' });

        expect(error?.details[0].message).toBe('New password is a required field');
    });
});
