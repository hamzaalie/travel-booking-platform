import { QRCodeSVG } from 'qrcode.react';

interface EsimQrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Renders an eSIM QR code. Handles three data formats:
 * - HTTP URL (image from provider) → renders as <img>
 * - data: URI (base64 image) → renders as <img>
 * - LPA string or other text → generates a QR code from the string
 */
export default function EsimQrCode({ value, size = 192, className }: EsimQrCodeProps) {
  if (!value) return null;

  // If it's an image URL or data URI, render as image
  if (value.startsWith('http') || value.startsWith('data:')) {
    return (
      <img
        src={value}
        alt="eSIM QR Code"
        className={className}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }

  // Otherwise generate a QR code from the string (e.g. LPA activation code)
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      includeMargin={false}
      className={className}
    />
  );
}
