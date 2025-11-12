export const generateBRCode = (pixKey: string, amount: number, merchantName: string, merchantCity: string, txid: string = 'AGENDALINK') => {
    // 1. Sanitização dos dados de entrada para garantir conformidade
    const sanitizedPixKey = pixKey.replace(/[().-\s]/g, '');
    const sanitizedTxid = txid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 35);
    
    // Remove acentos e caracteres especiais, mantendo apenas o essencial
    const sanitizeText = (text: string, maxLength: number) => {
        return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .substring(0, maxLength);
    };

    const sanitizedMerchantName = sanitizeText(merchantName, 25);
    const sanitizedMerchantCity = sanitizeText(merchantCity, 15);
    
    // 2. Montagem do payload EMV QR Code
    const payloadFormatIndicator = '000201';
    
    const merchantAccountInfo = [
        '0014br.gov.bcb.pix',
        `01${String(sanitizedPixKey.length).padStart(2, '0')}${sanitizedPixKey}`,
    ].join('');
    const merchantAccountInfoFull = `26${String(merchantAccountInfo.length).padStart(2, '0')}${merchantAccountInfo}`;

    const merchantCategoryCode = '52040000';
    const transactionCurrency = '5303986';
    const transactionAmount = `54${String(amount.toFixed(2).length).padStart(2, '0')}${amount.toFixed(2)}`;
    const countryCode = '5802BR';
    const merchantNameField = `59${String(sanitizedMerchantName.length).padStart(2, '0')}${sanitizedMerchantName}`;
    const merchantCityField = `60${String(sanitizedMerchantCity.length).padStart(2, '0')}${sanitizedMerchantCity}`;
    
    const referenceLabel = `05${String(sanitizedTxid.length).padStart(2, '0')}${sanitizedTxid}`;
    const additionalDataField = `62${String(referenceLabel.length).padStart(2, '0')}${referenceLabel}`;

    const payload = [
        payloadFormatIndicator,
        merchantAccountInfoFull,
        merchantCategoryCode,
        transactionCurrency,
        transactionAmount,
        countryCode,
        merchantNameField,
        merchantCityField,
        additionalDataField,
        '6304'
    ].join('');
    
    // 3. Cálculo do CRC16
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= (payload.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    crc &= 0xFFFF;

    const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
    return payload + crcHex;
};
