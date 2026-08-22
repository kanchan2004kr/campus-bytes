import { createHash } from 'node:crypto';
import {
  BadRequestException,
  Controller,
  HttpCode,
  Logger,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Query,
  ServiceUnavailableException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@campus-bytes/types';
import { Roles } from '../../common/auth/roles.decorator';

// Minimal shape of a Multer file (avoids a @types/multer dependency).
interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const FOLDER_RE = /^[a-zA-Z0-9/_-]+$/;

/**
 * Server-side image uploads. The browser sends the actual file (multipart/form-data)
 * to THIS endpoint; the server uploads it to Cloudinary using the API secret — which
 * never leaves the server and never appears in the frontend bundle. Restaurant owners
 * and admins may upload; students cannot (RBAC).
 */
@Controller('uploads')
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  private cloudinaryEnv() {
    // Trim: a trailing newline/space pasted into the env value (common with
    // dashboards) does NOT change the string-to-sign but silently breaks the
    // HMAC — Cloudinary then returns "Invalid Signature".
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
      apiKey: process.env.CLOUDINARY_API_KEY?.trim(),
      apiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
    };
  }

  /**
   * Signs and POSTs a buffer to Cloudinary using the server's API secret. Shared by the
   * real upload route and the self-test so both exercise the identical signing path.
   * Returns the secure URL, or throws with Cloudinary's exact error.
   */
  private async uploadBuffer(
    buffer: Buffer,
    mimetype: string,
    filename: string,
    folderRaw?: string,
  ): Promise<string> {
    const { cloudName, apiKey, apiSecret } = this.cloudinaryEnv();
    const missing = [
      !cloudName && 'CLOUDINARY_CLOUD_NAME',
      !apiKey && 'CLOUDINARY_API_KEY',
      !apiSecret && 'CLOUDINARY_API_SECRET',
    ].filter(Boolean) as string[];
    if (missing.length) {
      this.logger.error(`Cloudinary not configured — missing env: ${missing.join(', ')}`);
      throw new ServiceUnavailableException(
        `Image upload is not configured on the server (missing: ${missing.join(', ')}).`,
      );
    }

    const folder = folderRaw?.trim() || 'campusbytes';
    if (!FOLDER_RE.test(folder)) {
      throw new BadRequestException('Invalid folder.');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    // Log ONLY the signed params (never the secret or signature).
    this.logger.log(`Signing Cloudinary upload — folder=${folder}, timestamp=${timestamp}`);
    // Cloudinary signature: sha1 of the sorted "k=v&k=v" signed params + api secret.
    // The signed set here is exactly {folder, timestamp}. api_key and signature itself
    // are NOT part of the string-to-sign.
    const signature = createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(buffer)], { type: mimetype }), filename);
    form.append('api_key', apiKey!);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    let res: Response;
    try {
      res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: form,
      });
    } catch (err) {
      this.logger.error(`Cloudinary request failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Could not reach the image service. Please try again.');
    }

    const data = (await res.json().catch(() => null)) as
      | { secure_url?: string; error?: { message?: string } }
      | null;

    if (!res.ok || !data?.secure_url) {
      const detail = data?.error?.message ?? `HTTP ${res.status}`;
      this.logger.error(`Cloudinary upload rejected: ${detail}`);
      throw new BadRequestException(`Image upload failed: ${detail}`);
    }

    this.logger.log(`Uploaded ${filename} (${buffer.length}B) → ${data.secure_url}`);
    return data.secure_url;
  }

  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @Post('image')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_BYTES })],
        fileIsRequired: true,
      }),
    )
    file: UploadedImage,
    @Query('folder') folderRaw?: string,
  ): Promise<{ url: string }> {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Please choose a JPG, PNG or WEBP image.');
    }
    const url = await this.uploadBuffer(file.buffer, file.mimetype, file.originalname, folderRaw);
    return { url };
  }
}
