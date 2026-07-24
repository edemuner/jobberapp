import { IEmailLocals } from "@edemuner/jobber-shared";
import { logger } from "@notifications/logger";
import { Logger } from "winston";

const log: Logger = logger.for('mailTransport');

async function sendEmail(template: string, receiverEmail: string, locals: IEmailLocals): Promise<void>{
    try {
        // email templates
        log.info('Email sent succefully');
    } catch (error) {
        log.log('error', 'NotificationService MailTransport sendEmail error');
    }
}