import { createHash } from 'node:crypto';
import {
  Body,
  Controller,
  HttpCode,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { UserRole } from '@campus-bytes/types';
import { Roles } from '../../common/auth/roles.decorator';

class SignDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Matches(/^[a-zA-Z0-9/_-]+$/, { message: 'Invalid folder' })
  folder?: string;
}

/**
 * Secure server-side signing for direct-to-Cloudinary uploads. The browser POSTs
 * the file straight to Cloudinary using these signed params — the API SECRET never
 * leaves the server and never appears in the frontend bundle. Restaurant owners
 * and admins may request a signature; students cannot (RBAC).
 */
@Roles(UserRole.RESTAURANT, UserRole.ADMIN)
@Controller('uploads')
export class UploadsController {
  @Post('sign')
  @HttpCode(200)
  sign(@Body() dto: SignDto) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Image upload is not configured on the server.');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = dto.folder?.trim() || 'campusbytes';
    // Cloudinary signature: sha1 of the sorted "k=v&k=v" params + the api secret.
    const toSign: Record<string, string | number> = { folder, timestamp };
    const paramString = Object.keys(toSign)
      .sort()
      .map((k) => `${k}=${toSign[k]}`)
      .join('&');
    const signature = createHash('sha1').update(paramString + apiSecret).digest('hex');
    return { cloudName, apiKey, timestamp, folder, signature };
  }
}
