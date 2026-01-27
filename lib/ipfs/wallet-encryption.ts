'use client';

import { encrypt } from '@metamask/eth-sig-util';

export type WalletEncryptedPayload = {
  version: 'x25519-xsalsa20-poly1305';
  ephemPublicKey: string;
  nonce: string;
  ciphertext: string;
};

export function encryptPassphraseForWallet(publicKey: string, passphrase: string) {
  return encrypt({
    publicKey,
    data: passphrase,
    version: 'x25519-xsalsa20-poly1305',
  }) as WalletEncryptedPayload;
}

export async function decryptPassphraseWithWallet(
  payload: WalletEncryptedPayload,
  account: string,
) {
  if (typeof window === 'undefined' || !window.ethereum?.request) {
    throw new Error('Wallet provider not available');
  }

  // Normalize address to lowercase for MetaMask compatibility
  const normalizedAccount = account.toLowerCase();

  try {
    console.log('📦 Payload to decrypt:', payload);
    console.log('👛 Account (normalized):', normalizedAccount);

    // MetaMask eth_decrypt expects stringified encrypted data
    // Reference: https://docs.metamask.io/wallet/reference/eth_decrypt/
    const encryptedData = `0x${Buffer.from(JSON.stringify(payload), "utf8").toString("hex")}`;

    console.log('📦 Encrypted data string:', encryptedData);

    const decrypted = await window.ethereum.request({
      method: 'eth_decrypt',
      params: [encryptedData, normalizedAccount],
    });

    if (typeof decrypted !== 'string') {
      throw new Error('Failed to decrypt passphrase - unexpected response type');
    }

    console.log('✅ Decryption successful!');
    return decrypted;
  } catch (error: any) {
    console.error('❌ Decryption error details:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));

    // Provide more specific error messages
    if (error?.code === 4001) {
      throw new Error('Decryption cancelled - Please approve the decrypt request in MetaMask');
    }
    if (error?.code === -32603) {
      throw new Error(
        'MetaMask internal error (-32603). This is a known issue with MetaMask\'s deprecated eth_decrypt API. ' +
        'Please use Method 2 (Manual Passphrase) as a workaround.'
      );
    }
    if (error?.message?.includes('denied')) {
      throw new Error('Decryption denied - Please approve the decrypt request in MetaMask');
    }
    if (error?.message?.includes('Provided chainId')) {
      throw new Error('Wrong network - Please switch to the correct network in MetaMask');
    }

    // Re-throw with original error message for debugging
    throw new Error(`Decryption failed: ${error?.message || 'Unknown error'}`);
  }
}
