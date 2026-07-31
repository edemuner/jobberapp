jest.mock('../logger');
jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({})) }));

const mockSend = jest.fn();
jest.mock('email-templates', () => jest.fn().mockImplementation(() => ({ send: mockSend })));

import { emailTemplates } from '../helpers';
import { logger } from '../logger';

const mockLog = logger.for('test') as unknown as { error: jest.Mock };

describe('emailTemplates', () => {
    beforeEach(() => {
        mockSend.mockReset();
        mockLog.error.mockClear();
    });

    it('sends the templated email through the configured transport', async () => {
        mockSend.mockResolvedValueOnce(undefined);

        await emailTemplates('verifyEmail', 'buyer@example.com', { username: 'buyer' } as any);

        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(mockLog.error).not.toHaveBeenCalled();
    });

    it('logs the error when sending the templated email fails', async () => {
        const error = new Error('smtp connection refused');
        mockSend.mockRejectedValueOnce(error);

        await emailTemplates('verifyEmail', 'buyer@example.com', { username: 'buyer' } as any);

        expect(mockLog.error).toHaveBeenCalledWith(error);
    });
});
