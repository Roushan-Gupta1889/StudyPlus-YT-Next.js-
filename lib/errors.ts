/**
 * Standardized error handling utilities
 */

export enum ErrorCode {
    // Authentication & Authorization
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',

    // Validation
    INVALID_INPUT = 'INVALID_INPUT',
    MISSING_FIELD = 'MISSING_FIELD',

    // Resource errors
    NOT_FOUND = 'NOT_FOUND',
    ALREADY_EXISTS = 'ALREADY_EXISTS',

    // External services
    YOUTUBE_API_ERROR = 'YOUTUBE_API_ERROR',
    YOUTUBE_QUOTA_EXCEEDED = 'YOUTUBE_QUOTA_EXCEEDED',
    YOUTUBE_NOT_FOUND = 'YOUTUBE_NOT_FOUND',

    // Rate limiting
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

    // Internal
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
}

export interface ErrorResponse {
    error: {
        code: ErrorCode;
        message: string;
        details?: any;
    };
}

export class AppError extends Error {
    constructor(
        public code: ErrorCode,
        message: string,
        public statusCode: number = 500,
        public details?: any
    ) {
        super(message);
        this.name = 'AppError';
    }

    toJSON(): ErrorResponse {
        return {
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
            },
        };
    }
}

/**
 * Create standardized error responses
 */
export function createErrorResponse(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any
): { response: ErrorResponse; statusCode: number } {
    return {
        response: {
            error: {
                code,
                message,
                details,
            },
        },
        statusCode,
    };
}

/**
 * Handle YouTube API errors
 */
export function handleYouTubeError(error: any): AppError {
    console.error('[YOUTUBE_API_ERROR]', error);

    // Check for quota exceeded
    if (error.response?.status === 403) {
        const errorData = error.response?.data?.error;
        if (errorData?.errors?.[0]?.reason === 'quotaExceeded') {
            return new AppError(
                ErrorCode.YOUTUBE_QUOTA_EXCEEDED,
                'YouTube API quota exceeded. Please try again later.',
                429
            );
        }
    }

    // Not found
    if (error.response?.status === 404) {
        return new AppError(
            ErrorCode.YOUTUBE_NOT_FOUND,
            'YouTube video or playlist not found',
            404
        );
    }

    // Generic YouTube error
    return new AppError(
        ErrorCode.YOUTUBE_API_ERROR,
        'Failed to fetch data from YouTube. Please try again.',
        500,
        { originalError: error.message }
    );
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: any): AppError {
    console.error('[DATABASE_ERROR]', error);

    // Prisma unique constraint violation
    if (error.code === 'P2002') {
        return new AppError(
            ErrorCode.ALREADY_EXISTS,
            'Resource already exists',
            409,
            { fields: error.meta?.target }
        );
    }

    // Prisma not found
    if (error.code === 'P2025') {
        return new AppError(
            ErrorCode.NOT_FOUND,
            'Resource not found',
            404
        );
    }

    // Generic database error
    return new AppError(
        ErrorCode.DATABASE_ERROR,
        'Database operation failed',
        500,
        { code: error.code }
    );
}
