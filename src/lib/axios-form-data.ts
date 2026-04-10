/**
 * Axios instance mặc định gửi `Content-Type: application/json`.
 * Với `FormData`, cần bỏ header để browser set `multipart/form-data` + boundary.
 */
export function stripJsonContentTypeForFormData(
  data: unknown,
  headers: Record<string, unknown> | undefined
): unknown {
  if (data instanceof FormData && headers && typeof headers === "object") {
    delete headers["Content-Type"];
  }
  return data;
}
