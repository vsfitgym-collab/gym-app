// Generate a proper PIX static QR code payload (EMVCo standard)
export const generatePixPayload = (
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount?: number,
  txid?: string
): string => {
  const formatIndicator = '01'
  const merchantAccountInfo = `0014br.gov.bcb.pix01${pixKey.length.toString().padStart(2, '0')}${pixKey}`
  const merchantCategoryCode = '52040000'
  const transactionCurrency = '5303986'
  
  let amountField = ''
  if (amount) {
    const amountStr = amount.toFixed(2)
    amountField = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`
  }
  
  const countryCode = '5802BR'
  const merchantNameField = `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`
  const merchantCityField = `60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}`
  
  const additionalDataFieldTemplate = `05${(txid || '***').length.toString().padStart(2, '0')}${txid || '***'}`
  const additionalData = `62${additionalDataFieldTemplate.length.toString().padStart(2, '0')}${additionalDataFieldTemplate}`
  
  let payload = `${formatIndicator}26${merchantAccountInfo.length.toString().padStart(2, '0')}${merchantAccountInfo}${merchantCategoryCode}${transactionCurrency}${amountField}${countryCode}${merchantNameField}${merchantCityField}${additionalData}6304`
  
  // Calculate CRC16-CCITT
  const crc = calculateCRC16(payload)
  payload += crc
  
  return payload
}

const calculateCRC16 = (payload: string): string => {
  let crc = 0xFFFF
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
    }
    crc &= 0xFFFF
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}
