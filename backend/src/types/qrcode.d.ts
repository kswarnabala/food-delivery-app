declare module 'qrcode' {
  export interface QRCodeOptions {
    version?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: string;
    quality?: number;
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toDataURL(
    data: string | Buffer,
    options?: QRCodeOptions
  ): Promise<string>;

  export function toCanvas(
    canvas: any,
    data: string | Buffer,
    options?: QRCodeOptions
  ): Promise<any>;

  export function toString(
    data: string | Buffer,
    options?: QRCodeOptions
  ): Promise<string>;
}
