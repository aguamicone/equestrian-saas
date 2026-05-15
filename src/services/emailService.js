import emailjs from '@emailjs/browser';

// ⚠️ TODO: Replace these placeholders with your actual EmailJS keys
// You can get these from your EmailJS Dashboard: https://dashboard.emailjs.com/admin
const EMAILJS_CONFIG = {
    SERVICE_ID: 'YOUR_SERVICE_ID',
    TEMPLATE_ID_GENERIC: 'YOUR_TEMPLATE_ID',
    PUBLIC_KEY: 'YOUR_PUBLIC_KEY'
};

/**
 * Service to handle email dispatching.
 * Currently uses EmailJS (Client-side), but designed to be replaceable by a backend API.
 */
export const emailService = {
    /**
     * Checks if the service is configured
     */
    isConfigured: () => {
        return EMAILJS_CONFIG.SERVICE_ID !== 'YOUR_SERVICE_ID';
    },

    /**
     * Send a low stock alert to Admins
     * @param {string} itemName 
     * @param {number} currentStock 
     */
    sendStockAlert: async (itemName, currentStock) => {
        if (!emailService.isConfigured()) {
            console.log(`[Mock Email] Stock Alert: ${itemName} is low (${currentStock}). (Configure EmailJS to send real emails)`);
            return;
        }

        try {
            await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID_GENERIC, {
                to_name: 'Admin',
                subject: `🚨 Alerta de Stock: ${itemName}`,
                message: `El stock del insumo "${itemName}" ha descendido a niveles críticos. Quedan solo ${currentStock} unidades.`,
                action_url: window.location.origin + '/tenant-admin/inventory'
            }, EMAILJS_CONFIG.PUBLIC_KEY);
            console.log('Stock Alert sent via EmailJS');
        } catch (error) {
            console.error('Failed to send stock alert email:', error);
        }
    },

    /**
     * Send notification to Client about request status
     * @param {string} clientEmail 
     * @param {string} clientName 
     * @param {string} requestDetails 
     * @param {string} status 'approved' | 'rejected'
     */
    sendRequestUpdate: async (clientEmail, clientName, requestDetails, status) => {
        if (!emailService.isConfigured()) {
            console.log(`[Mock Email] To: ${clientEmail} | Status Update: ${status} for ${requestDetails}`);
            return;
        }

        const statusText = status === 'approved' ? 'Aprobada ✅' : 'Rechazada ❌';

        try {
            await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID_GENERIC, {
                to_name: clientName,
                to_email: clientEmail, // Requires EmailJS template to be configured to use this variable as recipient
                subject: `Tu solicitud fue ${statusText}`,
                message: `Hola ${clientName}, tu solicitud "${requestDetails}" ha sido ${statusText}.`,
                action_url: window.location.origin + '/client/requests'
            }, EMAILJS_CONFIG.PUBLIC_KEY);
            console.log('Request Update sent via EmailJS');
        } catch (error) {
            console.error('Failed to send request update email:', error);
        }
    }
};
