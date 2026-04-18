export declare const config: {
    port: string | number;
    nodeEnv: string;
    supabase: {
        url: string;
        anonKey: string;
        serviceRoleKey: string;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    encryption: {
        key: string;
    };
    blockchain: {
        polygonRpcUrl: string;
        privateKey: string;
    };
    sms: {
        apiKey: string;
        apiUrl: string;
    };
    fileUpload: {
        uploadPath: string;
        maxFileSize: number;
    };
    rateLimit: {
        auth: number;
        kyc: number;
        general: number;
    };
    cors: {
        allowedOrigins: string[];
    };
    logging: {
        level: string;
    };
    admin: {
        phone: string;
    };
};
//# sourceMappingURL=config.d.ts.map