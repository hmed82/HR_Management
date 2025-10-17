export interface AuthResponse {
    access_token: string;
    user: {
        id: number;
        email: string;
        role: string;
    };
}