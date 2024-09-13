import { Resend } from "resend";
import { prideEmail } from "./constants";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async (
  to: string,
  subject: string,
  msg: string,
  from = "Instaanalyzer <noreply@instaanalyser.com>"
) => {
  try {
    const data = await resend.emails.send({
      from: from,
      to: [to, prideEmail],
      subject: subject,
      html: msg,
    });
    console.log("mail send");
  } catch (error) {
    console.error(error);
  }
};
