export const MAX_LOGO_BYTES = 512 * 1024;

export type LogoReadResult = { ok: true; src: string } | { ok: false; message: string };

/**
 * Logos are kept as data URLs so the demo needs no file storage. Production would
 * upload to object storage and keep the URL. SVG is safe here: it only ever
 * renders through <img>, where scripts do not run.
 */
export async function readLogoFile(file: File): Promise<LogoReadResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "That file is not an image. Use PNG, JPG, SVG or WebP." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return {
      ok: false,
      message: "Keep the logo under 512 KB so invoices stay light to email.",
    };
  }

  try {
    const src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    return { ok: true, src };
  } catch {
    return { ok: false, message: "The file could not be read. Try another one." };
  }
}
