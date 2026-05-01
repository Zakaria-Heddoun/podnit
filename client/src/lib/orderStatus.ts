/**
 * Shared utility for order status display.
 *
 * Internal statuses: PENDING, PRINTED, RETURNED, CANCELLED, PAID, SHIPPED, DELIVERING
 * OZON statuses may be raw French strings pushed via webhook.
 * Returns are now MANUAL only — the RETURNED status is set by admin/employee.
 */

export type BadgeColor = 'success' | 'warning' | 'error' | 'info' | 'light';

/**
 * Check if a status represents a returned order.
 * With the manual return system, the only canonical return status is RETURNED.
 * We also keep the legacy French strings in case any old orders still carry them.
 */
export function isReturnStatus(status: string): boolean {
    if (!status) return false;
    const s = status.toLowerCase().trim();
    return (
        s === 'returned' ||
        s.includes('prêt pour le retour') ||
        s.includes('retour client expédié') ||
        s.includes('retour client reçu')
    );
}

/**
 * Get a Badge color for an order status string.
 */
export function getOrderStatusBadgeColor(status: string): BadgeColor {
    if (!status) return 'light';
    const s = status.toLowerCase().trim();

    // Internal: returned (manual)
    if (s === 'returned') return 'error';

    // Internal: delivered / paid
    if (s === 'paid' || s === 'livré' || s.includes('payé') || s.includes('paye')) return 'success';

    // Internal: pending
    if (s === 'pending') return 'warning';

    // Internal: printed (BL created on OZON)
    if (s === 'printed') return 'info';

    // Internal: cancelled
    if (s === 'cancelled') return 'error';

    // Legacy French return statuses (old orders)
    if (isReturnStatus(status)) return 'error';

    // In-transit / shipping
    if (
        s.includes('en cours') ||
        s.includes('expédié') || s.includes('expedie') ||
        s.includes('ramassé') || s.includes('ramasse') ||
        s.includes('en transit') ||
        s.includes('livraison') ||
        s.includes('distribut') ||
        s.includes('livreur') ||
        s === 'shipped' ||
        s === 'delivering'
    ) return 'info';

    // Scheduled / waiting
    if (
        s.includes('programmé') || s.includes('programme') ||
        s.includes('en attente') ||
        s.includes('réceptionné') || s.includes('receptionne') ||
        s.includes('reporté') || s.includes('reporte') ||
        s.includes('demande de suivi') ||
        s.includes('changement') ||
        s.includes('intéressé') || s.includes('interesse')
    ) return 'warning';

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
 * True when the order has moved past PENDING (ship button should be disabled).
 */
export function isOrderShipped(status: string): boolean {
    if (!status) return false;
    return status.toLowerCase().trim() !== 'pending';
}

/**
 * True when the order is fully delivered.
 */
export function isOrderDelivered(status: string): boolean {
    if (!status) return false;
    const s = status.toLowerCase().trim();
    return s === 'paid' || s === 'livré';
}
