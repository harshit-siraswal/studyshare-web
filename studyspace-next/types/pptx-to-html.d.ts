declare module "@jvmr/pptx-to-html" {
  export function pptxToHtml(
    arrayBuffer: ArrayBuffer,
    options?: {
      width?: number;
      height?: number;
      scaleToFit?: boolean;
      letterbox?: boolean;
    }
  ): Promise<string[]>;
}
