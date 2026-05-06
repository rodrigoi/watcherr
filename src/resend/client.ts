import { env } from "@/env";
import Notification, { type Removal, getSubject } from "@/notification";
import { Resend } from "resend";

export const resend = new Resend(env.RESEND_API_KEY);

export const sendNotification = async (
  removedDownloads: Removal[],
): Promise<void> => {
  if (removedDownloads.length === 0) {
    return;
  }

  await resend.emails.send({
    from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
    to: env.EMAIL_TO,
    subject: getSubject(removedDownloads),
    react: Notification({ removedDownloads }),
  });
};
