import { IEmailLocals } from "@edemuner/jobber-shared";
import { emailTemplates } from "@notifications/helpers";
import { logger } from "@notifications/logger";

const log = logger.for('mailTransport');

async function sendEmail(template: string, receiverEmail: string, locals: IEmailLocals): Promise<void>{
    try {
        emailTemplates(template, receiverEmail, locals);
        log.info('Email sent succefully');
    } catch (error) {
        log.log('error', 'NotificationService MailTransport sendEmail error');
    }
}

export { sendEmail };