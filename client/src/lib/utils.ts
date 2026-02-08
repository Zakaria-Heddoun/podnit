import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
}

export function getImageUrl(path?: string | null): string {
  if (!path) return '/images/placeholder-product.png';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  const apiUrl = getApiUrl();
  return `${apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}
