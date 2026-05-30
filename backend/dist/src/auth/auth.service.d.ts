import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(identifier: string, password: string): Promise<{
        user: {
            id: string;
            name: string;
            phone: string;
            email: string | null;
            role: import("@prisma/client").$Enums.Role;
        };
        token: string;
    }>;
}
