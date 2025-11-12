export const generateBRCode = (pixKey: string, amount: number, merchantName: string, merchantCity: string, txid: string = '***') => {
    const payloadFormatIndicator = '000201';
    
    const merchantAccountInfo = [
        '0014br.gov.bcb.pix',
        `01${String(pixKey.length).padStart(2, '0')}${pixKey}`,
    ].join('');
    const merchantAccountInfoFull = `26${String(merchantAccountInfo.length).padStart(2, '0')}${merchantAccountInfo}`;

    const merchantCategoryCode = '52040000';
    const transactionCurrency = '5303986';
    const transactionAmount = `54${String(amount.toFixed(2).length).padStart(2, '0')}${amount.toFixed(2)}`;
    const countryCode = '5802BR';
    const merchantNameField = `59${String(merchantName.length).padStart(2, '0')}${merchantName}`;
    const merchantCityField = `60${String(merchantCity.length).padStart(2, '0')}${merchantCity}`;
    const additionalDataField = `62070503${txid}`;

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
