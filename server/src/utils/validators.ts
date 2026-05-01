import { z } from "zod";
import { PrescriptionSchema } from "../graph/state";

/**
 * Zod-based Input Validators
 * All validators use .safeParse() and return z.SafeParseReturnType.
 * Callers check .success and access .data or .error accordingly.
 */

// ─── Image Upload Validation ────────────────────────────────────────────────

export const ImageUploadSchema = z.object({
  mimetype: z.enum(["image/jpeg", "image/png", "image/webp"], {
    errorMap: () => ({ message: "Invalid file type. Supported: JPEG, PNG, WebP" }),
  }),
  size: z.number().max(10 * 1024 * 1024, "File size must be under 10MB"),
  originalname: z.string().min(1, "File name is required"),
});

export const validateImageUpload = (file: unknown) =>
  ImageUploadSchema.safeParse(file);

// ─── Email Validation ───────────────────────────────────────────────────────

export const EmailSchema = z
  .string()
  .email("Invalid email format")
  .min(1, "Email is required");

export const validateEmail = (email: unknown) => EmailSchema.safeParse(email);

// ─── Phone Number Validation (E.164) ────────────────────────────────────────

export const PhoneSchema = z
  .string()
  .regex(
    /^\+[1-9]\d{1,14}$/,
    "Phone number must be in E.164 format (e.g., +919876543210)"
  );

export const validatePhoneNumber = (phone: unknown) =>
  PhoneSchema.safeParse(phone);

// ─── Medication Data Validation ─────────────────────────────────────────────
// Reuses PrescriptionSchema from state.ts for consistency

export const validateMedicationData = (data: unknown) =>
  PrescriptionSchema.safeParse(data);
