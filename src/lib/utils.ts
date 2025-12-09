import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  try {
    return clsx(inputs);
  } catch (error) {
    // Se houver erro ao processar classes (ex: navigation context), retornar string vazia
    console.warn('[cn] Error processing classes:', error);
    return '';
  }
}

