import { Injectable } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  public sendMail(payload: ISendMailOptions) {
    this.mailerService
      .sendMail({
        to: payload.to,
        from: 'obochi2@gmail.com',
        subject: payload.subject,
        text: payload?.text,
      })
      .then((resp) => {
        console.log(resp.data);
      })
      .catch((error) => {
        console.log('error from sending mail');
        console.log({ error });
      });
  }
}
