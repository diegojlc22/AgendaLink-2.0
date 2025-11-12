import { generateBRCode } from '../utils/pix';

// --- SIMULAÇÃO DE API BACKEND ---
// Em um aplicativo de produção, este arquivo faria chamadas `fetch` para o seu próprio servidor.
// Seu servidor, por sua vez, se comunicaria com segurança com o provedor de serviços PIX (seu banco, etc.).
// NUNCA exponha suas chaves de API PIX ou segredos no código do frontend.

interface CreatePixChargePayload {
    amount: number;
    pixKey: string;
    clientName: string;
    serviceName: string;
    appointmentId: string;
}

interface PixChargeResponse {
    qrCodeUrl: string;
    copyPaste: string;
    transactionId: string;
}

// Armazenamento em memória para simular o estado do pagamento no backend.
const paymentStatus: { [key: string]: 'pending' | 'paid' } = {};


/**
 * Simula a criação de uma cobrança PIX dinâmica no backend.
 * @param payload - Dados necessários para criar a cobrança.
 * @returns Uma promessa que resolve com os detalhes do PIX gerado.
 */
export const createPixCharge = (payload: CreatePixChargePayload): Promise<PixChargeResponse> => {
    console.log('[API MOCK] Recebida solicitação para criar cobrança PIX:', payload);
    
    // TODO: Substitua esta simulação por uma chamada `fetch` para o seu endpoint de backend.
    // Ex: const response = await fetch('/api/pix/charge', { method: 'POST', body: JSON.stringify(payload) });
    
    return new Promise((resolve, reject) => {
        if (!payload.pixKey || payload.pixKey.trim() === '') {
            return reject(new Error("Chave PIX não configurada."));
        }
        
        // Simula a latência da rede
        setTimeout(() => {
            const transactionId = `TXID_${payload.appointmentId}_${Date.now()}`;
            
            // O backend geraria este código com base na resposta do provedor PIX.
            const copyPasteCode = generateBRCode(
                payload.pixKey,
                payload.amount,
                'AgendaLink',
                'SAO PAULO',
                transactionId
            );

            // Armazena o status do pagamento como pendente
            paymentStatus[transactionId] = 'pending';

            // Simula o pagamento após 8 segundos
            setTimeout(() => {
                console.log(`[API MOCK] Pagamento para ${transactionId} foi processado.`);
                paymentStatus[transactionId] = 'paid';
            }, 8000);
            
            const response: PixChargeResponse = {
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(copyPasteCode)}`,
                copyPaste: copyPasteCode,
                transactionId: transactionId,
            };
            
            console.log('[API MOCK] Cobrança PIX gerada:', response);
            resolve(response);
        }, 1500); // Latência de 1.5s
    });
};


/**
 * Simula a verificação do status de um pagamento PIX no backend.
 * @param transactionId - O ID da transação a ser verificada.
 * @returns Uma promessa que resolve com o status do pagamento ('pending' ou 'paid').
 */
export const checkPixPaymentStatus = (transactionId: string): Promise<'pending' | 'paid'> => {
    console.log(`[API MOCK] Verificando status para a transação: ${transactionId}`);

    // TODO: Substitua esta simulação por uma chamada `fetch` para o seu endpoint de backend.
    // Ex: const response = await fetch(`/api/pix/status/${transactionId}`);
    // const data = await response.json();
    // return data.status;

    return new Promise((resolve) => {
        // Simula a latência da rede
        setTimeout(() => {
            const status = paymentStatus[transactionId] || 'pending';
            console.log(`[API MOCK] Status atual para ${transactionId}: ${status}`);
            resolve(status);
        }, 500); // Latência de 0.5s
    });
};