import crypto from "crypto";

const algorithm = "aes-256-cbc";
const keyString = process.env.KEY!;
const key = crypto
  .createHash("sha256")
  .update(keyString)
  .digest("base64")
  .slice(0, 32); // 256-bit key
const iv = crypto.randomBytes(16); // Initialization vector

export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(":");
  const ivBuffer = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
