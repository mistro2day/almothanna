import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
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
