import { State } from "../state";
import { STATUS } from "../constants";
import { emitStatus } from "../../sockets/socketEvents";
import { sendScheduleEmail } from "../../utils/emailService";
import {
  sendWhatsAppNotification,
  formatScheduleForWhatsApp,
} from "../../utils/whatsapp";

/**
 * Notification Node
 *
 * Triggers notifications after the medication schedule is finalized.
 * Sends email and WhatsApp messages with the schedule summary.
 *
 * Both channels are best-effort — failures are logged but never crash the pipeline.
 */
export const notifyNode = async (state: State) => {
  emitStatus("processing", "Notification Agent: Preparing to send medication schedule...");

  const logs: string[] = [];
  let emailSuccess = false;
  let whatsappSuccess = false;

  // ─── Email Notification ─────────────────────────────────────────────────

  // For V1 MVP, we use a placeholder email. In production, this would come
  // from the user's profile in MongoDB.
  const patientEmail = process.env.PATIENT_EMAIL || "";
  const patientName = state.extractedData?.patientName || "Patient";
  const patientPhone = process.env.PATIENT_PHONE || "";

  if (patientEmail) {
    emitStatus("processing", "Notification Agent: Sending email with medication schedule...");

    const emailResult = await sendScheduleEmail(
      patientEmail,
      state.schedule,
      patientName,
      state.safetyWarnings
    );

    if (emailResult.success) {
      emailSuccess = true;
      logs.push(`Notification Agent: Email sent to ${patientEmail}.`);
      if (emailResult.previewUrl) {
        logs.push(`Notification Agent: Ethereal preview — ${emailResult.previewUrl}`);
      }
      emitStatus("success", `Notification Agent: Email sent successfully.`);
    } else {
      logs.push(`Notification Agent: Email failed — ${emailResult.error}`);
      emitStatus("warning", `Notification Agent: Email sending failed — ${emailResult.error}`);
    }
  } else {
    logs.push("Notification Agent: No patient email configured. Skipping email.");
    emitStatus("info", "Notification Agent: No patient email configured. Skipping.");
  }

  // ─── WhatsApp Notification ──────────────────────────────────────────────

  if (patientPhone) {
    emitStatus("processing", "Notification Agent: Sending WhatsApp notification...");

    const waPayload = formatScheduleForWhatsApp(
      state.schedule,
      patientName,
      state.safetyWarnings
    );
    waPayload.phoneNumber = patientPhone;

    const waResult = await sendWhatsAppNotification(waPayload);

    if (waResult.success) {
      whatsappSuccess = true;
      logs.push(
        `Notification Agent: WhatsApp sent to ${patientPhone} (SID: ${waResult.messageSid}).`
      );
      emitStatus("success", "Notification Agent: WhatsApp notification sent.");
    } else {
      logs.push(`Notification Agent: WhatsApp failed — ${waResult.error}`);
      emitStatus("warning", `Notification Agent: WhatsApp failed — ${waResult.error}`);
    }
  } else {
    logs.push("Notification Agent: No patient phone configured. Skipping WhatsApp.");
    emitStatus("info", "Notification Agent: No patient phone configured. Skipping.");
  }

  // ─── Summary ────────────────────────────────────────────────────────────

  const channels = [];
  if (emailSuccess) channels.push("Email");
  if (whatsappSuccess) channels.push("WhatsApp");

  const summary =
    channels.length > 0
      ? `Notification Agent: Delivered via ${channels.join(" + ")}.`
      : "Notification Agent: No notifications were sent (no channels configured).";

  emitStatus(
    channels.length > 0 ? "success" : "warning",
    summary
  );

  return {
    executionLogs: [...state.executionLogs, ...logs, summary],
    status: channels.length > 0 ? STATUS.NOTIFIED : STATUS.NOTIFY_PARTIAL,
  };
};
