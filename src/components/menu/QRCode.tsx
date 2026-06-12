import { QRCodeSVG } from "qrcode.react";

interface QRCodeProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
}

export default function MenuQRCode({ 
  value, 
  size = 150, 
  level = "M", 
  includeMargin = true,
}: QRCodeProps) {
  return (
    <div className="flex flex-col items-center">
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        includeMargin={includeMargin}
        bgColor="white"
        fgColor="#ef4444"
      />
      <p className="mt-2 text-sm text-gray-600">
        Scan to view menu
      </p>
    </div>
  );
}


