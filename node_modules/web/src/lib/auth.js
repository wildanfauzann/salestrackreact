import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: "http://localhost:5173" // Frontend URL for proxy to /api
});

export const { signIn, signUp, useSession, signOut } = authClient;
