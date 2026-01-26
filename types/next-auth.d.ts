import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
            isIITMUser: boolean;
        };
    }

    interface User {
        isIITMUser?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        isIITMUser: boolean;
    }
}
