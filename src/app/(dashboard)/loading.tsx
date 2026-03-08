import { LoadingState } from '@/components/ui/LoadingState';

export default function DashboardLoading() {
    return (
        <LoadingState
            className="h-full min-h-[28rem]"
            eyebrow="Dashboard Sync"
            title="Atualizando workspace"
            description="Carregando cards, estatisticas e paines com o estado mais recente."
        />
    );
}
