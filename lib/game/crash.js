import crypto from 'crypto';

/**
 * Generates a deterministic crash point using HMAC-SHA256.
 * @param {string} serverSeed - The secret server seed.
 * @param {string} clientSeed - The client seed (placeholder or player provided).
 * @param {number} nonce - The incremental round counter.
 * @returns {number}
 */
export const generateCrashPoint = (serverSeed, clientSeed, nonce) => {

  const hash = crypto
    .createHmac('sha256', serverSeed)
    .update(`${clientSeed}-${nonce}`)
    .digest('hex');


  const hex = hash.substring(0, 13);
  const val = parseInt(hex, 16);

  
  const houseEdge = 0.97;
  const multiplier = Math.max(1, (Math.pow(2, 52) / (val + 1)) * houseEdge);

  return Math.floor(multiplier * 100) / 100;
};
