const fakeModel = {
    name: 'fake-auth-model',
    addHook: jest.fn(),
    prototype: {},
    sync: jest.fn()
};
const mockDefine = jest.fn().mockReturnValue(fakeModel);

jest.mock('@auth/database', () => ({
    sequelize: { define: mockDefine }
}));

import { compare, hash } from 'bcryptjs';
import { DataTypes } from 'sequelize';
import { AuthModel } from '../auth.schema';

describe('AuthModel', () => {
    it('defines the auths model on the shared sequelize instance', () => {
        expect(mockDefine).toHaveBeenCalledWith('auths', expect.any(Object), expect.any(Object));
    });

    it('marks the core profile fields as required strings', () => {
        const [, attributes] = mockDefine.mock.calls[0];

        expect(attributes.username).toMatchObject({ type: DataTypes.STRING, allowNull: false });
        expect(attributes.password).toMatchObject({ type: DataTypes.STRING, allowNull: false });
        expect(attributes.profilePublicId).toMatchObject({ type: DataTypes.STRING, allowNull: false });
        expect(attributes.email).toMatchObject({ type: DataTypes.STRING, allowNull: false });
        expect(attributes.country).toMatchObject({ type: DataTypes.STRING, allowNull: false });
        expect(attributes.profilePicture).toMatchObject({ type: DataTypes.STRING, allowNull: false });
    });

    it('makes verification and password-reset fields nullable', () => {
        const [, attributes] = mockDefine.mock.calls[0];

        expect(attributes.emailVerificationToken).toMatchObject({ type: DataTypes.STRING, allowNull: true });
        expect(attributes.passwordResetToken).toMatchObject({ type: DataTypes.STRING, allowNull: true });
        expect(attributes.passwordResetExpires).toMatchObject({ type: DataTypes.DATE, allowNull: true });
    });

    it('defaults emailVerified to false and stamps createdAt per row via a function reference', () => {
        const [, attributes] = mockDefine.mock.calls[0];

        expect(attributes.emailVerified).toMatchObject({ type: DataTypes.BOOLEAN, allowNull: false, defaultValue: 0 });
        expect(attributes.createdAt).toMatchObject({ type: DataTypes.DATE, defaultValue: Date.now });
    });

    it('exports the model returned by sequelize.define', () => {
        expect(AuthModel).toBe(fakeModel);
    });

    it('registers a hook that hashes passwords before creation', async () => {
        const [, beforeCreateHook] = fakeModel.addHook.mock.calls[0];
        const auth = { dataValues: { password: 'plain-password' } };

        await beforeCreateHook(auth);

        expect(auth.dataValues.password).not.toBe('plain-password');
        await expect(compare('plain-password', auth.dataValues.password)).resolves.toBe(true);
    });

    it('compares a plain password with a hashed password', async () => {
        const hashedPassword = await hash('plain-password', 10);

        await expect(AuthModel.prototype.comparePassword('plain-password', hashedPassword)).resolves.toBe(true);
        await expect(AuthModel.prototype.comparePassword('wrong-password', hashedPassword)).resolves.toBe(false);
    });

    it('synchronizes the model after defining it', () => {
        expect(fakeModel.sync).toHaveBeenCalledWith({});
    });
});
