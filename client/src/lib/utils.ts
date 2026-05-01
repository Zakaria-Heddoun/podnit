import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Use relative paths so requests go through the Next.js proxy
  return '';
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const apiUrl = getApiUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${apiUrl}${cleanPath}`;
}
