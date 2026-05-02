import { State } from "../state";
import { STATUS } from "../constants";
import { emitStatus } from "../../sockets/socketEvents";
import { sendScheduleNotification } from "../../utils/notification";

export const notifyNode = async (state: State) => {
  emitStatus("processing", "Notification Agent: Preparing to send medication schedule...");

  const logs: string[] = [];
  let notifySuccess = false;

  const patientName = state.extractedData?.patientName || "Patient";
  const patientPhone = state.patientPhone || process.env.PATIENT_PHONE || "";

  // ─── Notification (n8n + Twilio fallback) ──────────────────────────

  if (patientPhone) {
    emitStatus("processing", "Notification Agent: Sending notification...");

    const result = await sendScheduleNotification(
      patientPhone,
      state.schedule,
      patientName,
      state.safetyWarnings
    );

    if (result.success) {
      notifySuccess = true;
      logs.push(`Notification Agent: Sent to ${patientPhone} (ID: ${result.messageId}).`);
      emitStatus("success", `Notification Agent: Sent to ${patientPhone}.`);
    } else {
      logs.push(`Notification Agent: Failed — ${result.error}`);
      emitStatus("warning", `Notification Agent: Failed — ${result.error}`);
    }
  } else {
    logs.push("Notification Agent: No patient phone configured.");
    emitStatus("info", "Notification Agent: No patient phone configured.");
  }

  // ─── Summary ─────────────────────────────────────────

  const summary =
    notifySuccess
      ? "Notification Agent: Delivered successfully."
      : "Notification Agent: No notifications were sent.";

  emitStatus(
    notifySuccess ? "success" : "warning",
    summary
  );

  return {
    executionLogs: [...state.executionLogs, ...logs, summary],
    status: notifySuccess ? STATUS.NOTIFIED : STATUS.NOTIFY_PARTIAL,
  };
};