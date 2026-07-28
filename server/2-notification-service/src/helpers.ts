import { logger } from "./logger";
import { IEmailLocals } from "@edemuner/jobber-shared";
import nodemailer, { Transporter } from 'nodemailer';
import { jobberConfig } from "./config";
import Email from 'email-templates';
import path from 'path';

const log = logger.for('mailTransportHelper');

async function emailTemplates(templates: string, to: string, locals: IEmailLocals): Promise<void> {
    try {
        const smptTransport: Transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: jobberConfig.SENDER_EMAIL,
                pass: jobberConfig.SENDER_EMAIL_PASSWORD
            }
        });

        const email: Email = new Email({
            message: {
                from: `Jobber App <${jobberConfig.SENDER_EMAIL}>`
            },
            send: true,
            preview: false,
            transport: smptTransport,
            views: {
                options: {
                    extension:'ejs'
                }
            },
            juice: true,
            juiceResources: {
                preserveImportant: true,
                webResources: {
                    relativeTo: path.join(__dirname, '../build')
                }
            }
        });

        await email.send({
            template: path.join(__dirname, '..', 'src/emails', templates),
            message: { to },
            locals
        })
    } catch (error) {
        log.error(error);
    }
}

export { emailTemplates }