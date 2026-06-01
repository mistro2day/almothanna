import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

export function getUserIdFromRequest(req: Request, jwtService: JwtService): string {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return 'system';
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwtService.verify(token, {
      secret: process.env.JWT_SECRET || 'JWT_SUPER_SECRET_KEY_FOR_MOTHANNA',
    });
    return payload.sub;
  } catch (e) {
    try {
      const decoded: any = jwtService.decode(token);
      return decoded?.sub || 'system';
    } catch {
      return 'system';
    }
  }
}
