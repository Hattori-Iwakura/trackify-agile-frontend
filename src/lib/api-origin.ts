/**
 * Origin để ghép URL file tĩnh (/uploads/...) từ DB.
 * Nếu chỉ dựa vào NEXT_PUBLIC_API_URL kiểu `http://localhost:3000/api` thì origin suy ra là :3000 — Next không
 * phục vụ /uploads; ảnh nằm trên Nest → ưu tiên NEXT_PUBLIC_UPLOAD_ORIGIN (vd http://localhost:4000).
 */
export function getApiOriginFromPublicUrl(): string {
  const uploadOrigin = process.env.NEXT_PUBLIC_UPLOAD_ORIGIN ?? '';
  if (uploadOrigin) return uploadOrigin.replace(/\/$/, '');

  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  if (base && !base.startsWith('/')) {
    return base.replace(/\/api\/?$/i, '');
  }
  return '';
}

export function resolvePublicFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const origin = getApiOriginFromPublicUrl();
  if (!origin) return null;
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}
