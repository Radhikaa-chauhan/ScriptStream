import Twilio from "twilio";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

/**
 * Format schedule for SMS
 */
const formatSMSBody = (schedule: any, patientName: string, warnings: string[]) => {
    let body = `💊 ScriptStream: Hi ${patientName}, your schedule is ready!\n\n`;

    if (schedule.morning?.length) body += `🌅 Morning: ${schedule.morning.join(", ")}\n`;
    if (schedule.afternoon?.length) body += `☀️ Afternoon: ${schedule.afternoon.join(", ")}\n`;
    if (schedule.evening?.length) body += `🌆 Evening: ${schedule.evening.join(", ")}\n`;
    if (schedule.night?.length) body += `🌙 Night: ${schedule.night.join(", ")}\n`;

    if (warnings?.length) {
        body += `\n⚠️ Warnings: ${warnings.slice(0, 2).join(", ")}`;
    }

    body += `\n\nConsult your doctor for advice.`;
    return body;
};

export const sendScheduleNotification = async (
    to: string,
    schedule: any,
    patientName: string,
    warnings: string[] = []
) => {
    // 🔥 STEP 1: Twilio (Primary)
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        let fromNumber = process.env.TWILIO_SMS_FROM;

        if (accountSid && authToken && fromNumber) {
            const client = Twilio(accountSid, authToken);
            const body = formatSMSBody(schedule, patientName, warnings);

            // 🛑 FORCE the correct WhatsApp formatting, regardless of .env
            // This strips any existing 'whatsapp:' prefix and re-adds it safely
            fromNumber = fromNumber.replace('whatsapp:', '');
            const twilioFrom = `whatsapp:${fromNumber}`;
            const twilioTo = `whatsapp:+91${to.replace(/\D/g, "")}`;

            // 🛑 DEBUG LOGS: Watch your terminal for these lines!
            console.log(`[TWILIO DEBUG] Attempting to send FROM: ${twilioFrom}`);
            console.log(`[TWILIO DEBUG] Attempting to send TO: ${twilioTo}`);

            const message = await client.messages.create({
                body: body,
                from: twilioFrom,
                to: twilioTo,
            });

            console.log(`[TWILIO] ✅ Sent to ${twilioTo} (SID: ${message.sid})`);
            return { success: true, messageId: message.sid };
        }
    } catch (err: any) {
        console.error("[TWILIO] ❌ Failed:", err.message);
        // Fallback to n8n if Twilio fails
    }

    // 🔄 STEP 2: n8n Fallback
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
        try {
            const payload = {
                patientPhone: to,
                patientName,
                schedule,
                warnings,
                timestamp: new Date().toISOString(),
            };

            await axios.post(webhookUrl, payload);
            console.log("[N8N] ✅ Sent");
            return { success: true, messageId: "n8n-" + Date.now() };
        } catch (err: any) {
            console.warn("[N8N] ❌ Failed");
        }
    }

    return { success: false, error: "No notification service worked" };
};