import { supabase } from "./supabaseClient";

export interface FileValidationOptions {
  maxSizeBytes?: number; // Default 2MB
  allowedMimeTypes?: string[];
}

const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Inspects magic header bytes of a File to verify true binary format.
 */
async function verifyMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return true;
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return true;
  }
  // WEBP: 52 49 46 46 (RIFF)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return true;
  }

  return false;
}

export async function validateUploadFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<{ valid: boolean; error?: string }> {
  const maxSize = options.maxSizeBytes || DEFAULT_MAX_SIZE;
  const allowedTypes = options.allowedMimeTypes || ALLOWED_MIME_TYPES;

  // 1. Size Check
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds limit (${(maxSize / (1024 * 1024)).toFixed(0)}MB max).` };
  }

  // 2. MIME Type Check
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { valid: false, error: "Invalid file type. Only PNG, JPEG, and WebP images are permitted." };
  }

  // 3. Magic Byte Header Check (prevents extension spoofing / executable upload)
  const isMagicValid = await verifyMagicBytes(file);
  if (!isMagicValid) {
    return { valid: false, error: "File content signature verification failed. Please select a valid image." };
  }

  return { valid: true };
}

/**
 * Safely uploads image to isolated Supabase Storage bucket with randomized non-executable UUID filename.
 */
export async function uploadAvatarImage(file: File, userId: string): Promise<string> {
  const validation = await validateUploadFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate safe random UUID filename (no executable scripts)
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  const safeFilename = `${userId}/${crypto.randomUUID()}${ext}`;

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(safeFilename, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}
