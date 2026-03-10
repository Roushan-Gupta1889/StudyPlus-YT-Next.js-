/**
 * Environment variable validation
 * Call this at app startup to ensure all required env vars are present
 */

const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'YOUTUBE_API_KEY',
] as const;

const optionalEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'ANTHROPIC_API_KEY',
] as const;

export function validateEnv() {
    const missing: string[] = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
            `Please check your .env file and ensure all required variables are set.`
        );
    }

    // Warn about missing optional vars
    const missingOptional: string[] = [];
    for (const envVar of optionalEnvVars) {
        if (!process.env[envVar]) {
            missingOptional.push(envVar);
        }
    }

    if (missingOptional.length > 0) {
        console.warn(
            `⚠️  Missing optional environment variables (some features may not work):\n${missingOptional.map(v => `  - ${v}`).join('\n')}`
        );
    }

    console.log('✅ Environment variables validated successfully');
}

// Validate on module load in production
if (process.env.NODE_ENV === 'production') {
    validateEnv();
}
