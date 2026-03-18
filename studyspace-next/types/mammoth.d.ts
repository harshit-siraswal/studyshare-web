declare module 'mammoth' {
    export interface MammothWarning {
        type: 'warning';
        message: string;
    }

    export interface MammothError {
        type: 'error';
        message: string;
        error: unknown;
    }

    export type MammothMessage = MammothWarning | MammothError;

    export interface MammothResult {
        value: string;
        messages: MammothMessage[];
    }

    export interface MammothOptions {
        path?: string;
        buffer?: Buffer;
        arrayBuffer?: ArrayBuffer;
        styleMap?: string;
        includeEmbeddedStyleMap?: boolean;
        includeDefaultStyleMap?: boolean;
        convertImage?: unknown;
        ignoreEmptyParagraphs?: boolean;
        idPrefix?: string;
        transformDocument?: (document: unknown) => unknown;
    }

    export function convertToHtml(options: MammothOptions): Promise<MammothResult>;
}