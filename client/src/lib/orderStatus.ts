/**
 * Shared utility for order status display.
 * 
 * Orders use raw delivery API (EliteSpeed) statuses in French.
 * The only internal statuses are PENDING and PRINTED.
 * After PRINTED, the status is whatever the delivery API returns.
 * 
 * When status is "Livré" → order is delivered/finished.
 * Return statuses: "En voyage", "hors zone", "Annuler", "Refusé"
 */

export type BadgeColor = 'success' | 'warning' | 'error' | 'info' | 'light';

/**
 * The exact return statuses from EliteSpeed delivery API.
 * Must match the server-side Order::RETURN_STATUSES.
 */
export const RETURN_STATUSES = [
    'en voyage',
    'hors zone',
    'annuler',
    'refusé',
];

/**
 * Check if a status is a return status.
 */
export function isReturnStatus(status: string): boolean {
    if (!status) return false;
    const s = status.toLowerCase().trim();
    return RETURN_STATUSES.some(rs => s.includes(rs));
}

/**
 * Get a Badge color for an order status string.
 * Works with both internal statuses (PENDING, PRINTED) and
 * raw French delivery API statuses (Livré, Refusé, etc.)
 */
export function getOrderStatusBadgeColor(status: string): BadgeColor {
    if (!status) return 'light';
    const s = status.toLowerCase().trim();

    // --- Delivered (finished) ---
    if (s === 'livré') return 'success';

    // --- Internal statuses ---
    if (s === 'pending') return 'warning';
    if (s === 'printed') return 'info';

    // --- Return statuses (en voyage, hors zone, annuler, refusé) ---
    if (isReturnStatus(status)) return 'error';

    // --- Positive in-transit statuses ---
    if (s.includes('en cours de livraison')) return 'info';
    if (s.includes('expédié') || s.includes('expedie')) return 'info';
    if (s.includes('ramassé') || s.includes('ramasse')) return 'info';
    if (s.includes('en transit')) return 'info';
    if (s.includes('au dépôt') || s.includes('au depot')) return 'info';
    if (s.includes('en cours de ramassage')) return 'info';
    if (s.includes('reçu par agence')) return 'info';
    if (s.includes('en attente')) return 'warning';
    if (s.includes('programmé') || s.includes('programme')) return 'info';
    if (s.includes('report')) return 'warning';
    if (s.includes('demande de suivi')) return 'warning';

    // --- Partial delivery ---
    if (s.includes('livré parcial') || s.includes('livre parcial')) return 'warning';

    // --- Payment ---
    if (s.includes('payé') || s.includes('paye') || s === 'paid') return 'success';

    // Default
    return 'light';
}

/**
 * Get Tailwind CSS classes for an order status (used in DataTables).
 */
export function getOrderStatusClasses(status: string): string {
    const color = getOrderStatusBadgeColor(status);
    switch (color) {
        case 'success':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'warning':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'error':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'info':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
}

/**
 * Check if a status means the order has been shipped/sent to delivery.
 * Used to determine if the "Ship" button should be disabled.
 */
export function isOrderShipped(status: string): boolean {
    if (!status) return false;
    const s = status.toLowerCase().trim();
    return s !== 'pending';
}

/**
 * Check if a status means the order is delivered/finished.
 */
export function isOrderDelivered(status: string): boolean {
    if (!status) return false;
    return status.toLowerCase().trim() === 'livré';
}
