declare module 'canvas-confetti' {
    export type Shape = 'square' | 'circle';

    export type Origin = {
        x: number;
        y: number;
    };

    export type Options = {
        angle?: number;
        colors?: string[];
        decay?: number;
        disableForReducedMotion?: boolean;
        drift?: number;
        gravity?: number;
        origin?: Origin;
        particleCount?: number;
        scalar?: number;
        shapes?: Shape[];
        spread?: number;
        startVelocity?: number;
        ticks?: number;
        zIndex?: number;
    };

    export type GlobalOptions = {
        disableForReducedMotion?: boolean;
        resize?: boolean;
        useWorker?: boolean;
    };

    export type CreateTypes = ((options?: Options) => Promise<unknown> | null) & {
        reset: () => void;
    };

    export type ConfettiFunction = CreateTypes & {
        create: (canvas: HTMLCanvasElement, options?: GlobalOptions) => CreateTypes;
        reset: () => void;
    };

    const confetti: ConfettiFunction;

    export default confetti;
}
