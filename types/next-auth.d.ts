import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
            isIITMUser: boolean;
            role: string;
        };
    }

    interface User {
        isIITMUser?: boolean;
        role?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        isIITMUser: boolean;
        role: string;
    }
}
