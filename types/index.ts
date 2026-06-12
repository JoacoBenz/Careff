/** Shared application types. Domain-specific types grow here. */

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
}
