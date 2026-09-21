import { sequelize } from "@auth/database";
import { IAuthDocument } from "@edemuner/jobber-shared";
import { compare, hash } from "bcryptjs";
import { DataTypes, Model, Optional } from "sequelize";

const SALT_ROUND = 10;

type AuthAttributes = Omit<IAuthDocument, 'comparePassword' | 'hashPassword'>;
type AuthUserCreationAttributes = Optional<AuthAttributes, 'id' | 'createdAt' | 'passwordResetToken' | 'passwordResetExpires'>;

interface AuthModelInstance extends Model<AuthAttributes, AuthUserCreationAttributes> {
    comparePassword(password: string, hashedPassword: string): Promise<boolean>;
}

const AuthModel = sequelize.define<AuthModelInstance, AuthUserCreationAttributes>('auths', {
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profilePublicId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: false
    },
    emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: Date.now
    },
    passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },

}, {
    indexes: [
        {
            unique: true,
            fields: ['email']
        },
        {
            unique:true,
            fields: ['username']
        }
    ]
}) as ReturnType<typeof sequelize.define<AuthModelInstance, AuthUserCreationAttributes>> & {
    prototype: AuthModelInstance;
};

AuthModel.addHook('beforeCreate', async (auth: Model) => {
    const hashedPassword: string = await hash(auth.dataValues.password as string, SALT_ROUND);
    auth.dataValues.password = hashedPassword;
});

AuthModel.prototype.comparePassword = async function (password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
}

// force: true always deletes the table
AuthModel.sync({});
export { AuthModel }
