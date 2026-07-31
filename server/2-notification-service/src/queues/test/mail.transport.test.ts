jest.mock('@notifications/logger');

const mockEmailTemplates = jest.fn();
jest.mock('@notifications/helpers', () => ({ emailTemplates: mockEmailTemplates }));

import { sendEmail } from '../mail.transport';
import { logger } from '@notifications/logger';

const mockLog = logger.for('test') as unknown as { info: jest.Mock; log: jest.Mock };

describe('sendEmail', () => {
    beforeEach(() => {
        mockEmailTemplates.mockReset();
        mockLog.info.mockClear();
        mockLog.log.mockClear();
    });

    it('sends the email via emailTemplates and logs success', async () => {
        mockEmailTemplates.mockResolvedValueOnce(undefined);

        await sendEmail('verifyEmail', 'buyer@example.com', { username: 'buyer' } as any);

        expect(mockEmailTemplates).toHaveBeenCalledWith('verifyEmail', 'buyer@example.com', { username: 'buyer' });
        expect(mockLog.info).toHaveBeenCalledWith('Email sent succefully');
    });

    it('logs an error when emailTemplates throws', async () => {
        mockEmailTemplates.mockImplementationOnce(() => {
            throw new Error('template rendering failed');
        });

        await sendEmail('verifyEmail', 'buyer@example.com', {} as any);

        expect(mockLog.log).toHaveBeenCalledWith('error', 'NotificationService MailTransport sendEmail error');
    });
});
