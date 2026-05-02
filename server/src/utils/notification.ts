import Twilio from "twilio";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

export const sendScheduleNotification = async (
    to: string,
    schedule: any,
    patientName: string,
    warnings: string[] = []
) => {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    // ✅ STEP 1: Try n8n
    if (webhookUrl) {
        try {
            const safeSchedule = {
                morning: schedule.morning || [],
                afternoon: schedule.afternoon || [],
                evening: schedule.evening || [],
                night: schedule.night || [],
            };

            const payload = {
                patientPhone: `whatsapp:+91${to.replace(/\D/g, "")}`,
                patientName,
                schedule: safeSchedule,
                warnings,
                timestamp: new Date().toISOString(),
            };

            await axios.post(webhookUrl, payload);

            console.log("[N8N] ✅ Sent");
            return { success: true, messageId: "n8n-" + Date.now() };

        } catch (err: any) {
            console.warn("[N8N] ❌ Failed → fallback to Twilio");
        }
    }

    // ✅ STEP 2: Twilio fallback
    try {
        const client = Twilio(
            process.env.TWILIO_ACCOUNT_SID!,
            process.env.TWILIO_AUTH_TOKEN!
        );

        const message = await client.messages.create({
            body: `Hi ${patientName}, your medication schedule is ready.`,
            from: process.env.TWILIO_SMS_FROM!,
            to: `+91${to.replace(/\D/g, "")}`,
        });

        return { success: true, messageId: message.sid };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
};