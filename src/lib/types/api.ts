/** Khớp TransformInterceptor của Nest: { statusCode, data, timestamp } */
export interface ApiSuccessEnvelope<T> {
  statusCode: number;
  data: T;
  timestamp: string;
}

export type GlobalRole = "ADMIN" | "USER";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: GlobalRole;
  createdAt: string;
  updatedAt: string;
}

/** Phản hồi phân trang giống Nest `PaginatedResult`. */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
}
