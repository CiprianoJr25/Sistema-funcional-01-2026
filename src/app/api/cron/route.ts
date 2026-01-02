
import { NextResponse } from 'next/server';
import { generatePreventiveTickets } from '@/lib/services/preventive-maintenance-service';

// Este endpoint é protegido pelo App Hosting e só pode ser chamado
// por serviços autenticados do Google Cloud, como o Cloud Scheduler.
export async function GET(request: Request) {
  try {
    const result = await generatePreventiveTickets();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao executar a tarefa de manutenção preventiva:', error);
    return NextResponse.json({ error: 'Falha na execução da tarefa', details: error.message }, { status: 500 });
  }
}
