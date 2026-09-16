import Joi, { ObjectSchema } from 'joi';

const loginSchema: ObjectSchema = Joi.object().keys({
    username: Joi.alternatives().conditional(
        Joi.string().email(), {
            then: Joi.string()
                    .email()
                    .min(4)
                    .max(12)
                    .required()
                    .messages({
                        'string.base': 'email must be of type string',
                        'string.email': ' Invalid email',
                        'string.empty': 'email is a required field'
                    }),
            otherwise: Joi.string()
                    .min(4)
                    .max(12)
                    .required()
                    .messages({
                        'string.base': 'Username must be of type string',
                        'string.min': ' Invalid username',
                        'string.max': ' Invalid username',
                        'string.empty': 'Username is a required field'
                    }),
        }
    ),
    password: Joi.string()
        .min(4)
        .max(12)
        .required()
        .messages({
            'string.base': 'password must be of type string',
            'string.min': ' Invalid password',
            'string.max': ' Invalid password',
            'string.empty': 'password is a required field'
        }),
    
})

export { loginSchema }