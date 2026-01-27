'use client';

export type EncryptionMetadata = {
  version: number;
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2';
  hash: 'SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  originalName: string;
  mimeType: string;
  size: number;
};

const textEncoder = new TextEncoder();

function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function generatePassphrase(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return toBase64(bytes);
}

function fromBase64(encoded: string) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
  usages: KeyUsage[],
) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      // salt: salt.buffer.slice(
      //   salt.byteOffset,
      //   salt.byteOffset + salt.byteLength,
      // ),
    salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    usages,
  );
}

export async function encryptFileWithPassphrase(file: File, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const key = await deriveKey(passphrase, salt, iterations, ['encrypt']);
  const fileBuffer = await file.arrayBuffer();

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer,
  );

  const encryptedFile = new File([encryptedBuffer], `${file.name}.enc`, {
    type: 'application/octet-stream',
  });

  const metadata: EncryptionMetadata = {
    version: 1,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2',
    hash: 'SHA-256',
    iterations,
    salt: toBase64(salt),
    iv: toBase64(iv),
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
  };

  return { encryptedFile, metadata };
}

export async function decryptFileWithPassphrase(
  encryptedUrl: string,
  metadata: EncryptionMetadata,
  passphrase: string,
) {
  const encryptedResponse = await fetch(encryptedUrl);
  if (!encryptedResponse.ok) {
    throw new Error(`Failed to fetch encrypted file: ${encryptedResponse.status} ${encryptedResponse.statusText}`);
  }

  const encryptedBuffer = await encryptedResponse.arrayBuffer();
  const salt = fromBase64(metadata.salt);
  const iv = fromBase64(metadata.iv);

  const key = await deriveKey(passphrase, salt, metadata.iterations, ['decrypt']);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBuffer,
    );
  } catch (error) {
    throw new Error('Failed to decrypt file. Passphrase may be invalid or key outdated.');
  }

  return new Blob([decryptedBuffer], { type: metadata.mimeType });
}
