import Twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

/**
 * SMS Notification Service (Twilio)
 *
 * Sends the medication schedule as an SMS to the patient's phone number.
 * Uses the same Twilio credentials as the WhatsApp service.
 *
 * Requires in .env:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_SMS_FROM  (your Twilio phone number, e.g. +14155238886)
 */

/**
 * Format a medication schedule into a concise SMS body
 */
const formatScheduleSMS = (
  schedule: any,
  patientName: string,
  warnings: string[]
): string => {
  const lines: string[] = [];
  lines.push(`💊 ScriptStream — Hi ${patientName}! Your medication schedule:`);

  if (schedule.morning?.length > 0)
    lines.push(`🌅 Morning: ${schedule.morning.join(", ")}`);
  if (schedule.afternoon?.length > 0)
    lines.push(`☀️ Afternoon: ${schedule.afternoon.join(", ")}`);
  if (schedule.evening?.length > 0)
    lines.push(`🌆 Evening: ${schedule.evening.join(", ")}`);
  if (schedule.night?.length > 0)
    lines.push(`🌙 Night: ${schedule.night.join(", ")}`);

  if (schedule.notes?.length > 0) {
    lines.push(`📝 Notes: ${schedule.notes.join(" | ")}`);
  }

  if (warnings.length > 0) {
    lines.push(`⚠️ Warning: ${warnings.slice(0, 2).join(" | ")}`);
  }

  lines.push(`Consult your doctor before any changes.`);

  return lines.join("\n");
};

/**
 * Send medication schedule via Twilio SMS
 *
 * @param to          - Patient's phone number (E.164 format, e.g. "+919876543210")
 * @param schedule    - Medication schedule object
 * @param patientName - Patient's name
 * @param warnings    - Safety warnings array
 */
export const sendScheduleEmail = async (
  to: string,
  schedule: any,
  patientName: string,
  warnings: string[] = []
): Promise<{
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_SMS_FROM || process.env.TWILIO_WHATSAPP_FROM?.replace("whatsapp:", "") || "";

  if (!accountSid || !authToken || !fromNumber) {
    console.warn(
      "[SMS] Twilio not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM missing). Skipping SMS."
    );
    return {
      success: false,
      error: "Twilio SMS credentials not configured",
    };
  }

  if (!to) {
    return {
      success: false,
      error: "No patient phone number provided",
    };
  }

  try {
    const client = Twilio(accountSid, authToken);
    const body = formatScheduleSMS(schedule, patientName, warnings);

    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });

    console.log(`[SMS] ✅ Schedule sent to ${to} (SID: ${message.sid})`);

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    console.error(`[SMS] ❌ Failed to send SMS to ${to}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};
