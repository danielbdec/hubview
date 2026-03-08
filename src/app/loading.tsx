import { LoadingState } from '@/components/ui/LoadingState';

export default function Loading() {
    return (
        <LoadingState
            fullScreen
            eyebrow="Hubview Boot Sequence"
            title="Preparando ambiente"
            description="Sincronizando sessao, interface e modulos essenciais para a proxima tela."
        />
    );
}
