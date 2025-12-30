
// Este arquivo contém a lógica que será usada em uma Cloud Function para
// automatizar a criação de chamados de manutenção preventiva.

import { collection, getDocs, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Client, ExternalTicket } from '@/lib/types';
import { differenceInDays } from 'date-fns';

/**
 * Busca o último chamado preventivo para um cliente específico e um setor específico.
 * @param clientId - ID do cliente.
 * @param sectorId - ID do setor.
 * @returns O último chamado preventivo ou null se não houver.
 */
async function findLastPreventiveTicket(clientId: string, sectorId: string): Promise<ExternalTicket | null> {
  const ticketsRef = collection(db, 'external-tickets');
  const q = query(
    ticketsRef,
    where('client.id', '==', clientId),
    where('sectorId', '==', sectorId),
    where('type', 'in', ['contrato', 'padrão']), // Assumindo que preventivas são de 'contrato' ou 'padrão' gerado
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const lastTicketDoc = querySnapshot.docs[0];
    return { id: lastTicketDoc.id, ...lastTicketDoc.data() } as ExternalTicket;
  }
  return null;
}

/**
 * Função principal que verifica os clientes e gera os chamados preventivos necessários.
 * Esta função deve ser chamada por um agendador (cron job) no backend (ex: Firebase Scheduled Function).
 */
export async function generatePreventiveTickets() {
  console.log('Iniciando verificação de manutenções preventivas...');
  const clientsRef = collection(db, 'clients');
  const q = query(clientsRef, where('status', '==', 'active'), where('preventiveContract', '!=', null));

  const clientsSnapshot = await getDocs(q);
  if (clientsSnapshot.empty) {
    console.log('Nenhum cliente com contrato preventivo ativo encontrado.');
    return;
  }

  const today = new Date();
  const createdTickets: string[] = [];

  // Usando for...of para lidar corretamente com as Promises dentro do loop
  for (const clientDoc of clientsSnapshot.docs) {
    const client = { id: clientDoc.id, ...clientDoc.data() } as Client;
    const contract = client.preventiveContract;

    if (!contract || contract.sectorIds.length === 0 || contract.frequencyDays <= 0) {
      continue; // Pula se o contrato for inválido
    }

    for (const sectorId of contract.sectorIds) {
      const lastTicket = await findLastPreventiveTicket(client.id, sectorId);
      
      const lastVisitDate = lastTicket ? new Date(lastTicket.createdAt) : new Date(0); // Se não houver, usa uma data antiga para forçar a criação
      const daysSinceLastVisit = differenceInDays(today, lastVisitDate);

      if (daysSinceLastVisit >= contract.frequencyDays) {
        console.log(`Gerando chamado preventivo para ${client.name} no setor ${sectorId}.`);

        const newTicketData: Omit<ExternalTicket, 'id'> = {
          client: {
            id: client.id,
            name: client.name,
            phone: client.phone,
            isWhats: false, // Default
            address: `${client.address.street}, ${client.address.number}`,
          },
          requesterName: 'Sistema (Preventiva Automática)',
          sectorId: sectorId,
          creatorId: 'system', // Identificador para o sistema
          description: `Manutenção preventiva programada conforme contrato (Frequência: ${contract.frequencyDays} dias).`,
          type: 'contrato', // Classifica como tipo 'contrato'
          status: 'pendente',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          comments: [],
        };

        try {
          const docRef = await addDoc(collection(db, 'external-tickets'), newTicketData);
          createdTickets.push(docRef.id);
          console.log(`Chamado ${docRef.id} criado com sucesso.`);
        } catch (error) {
          console.error(`Falha ao criar chamado para o cliente ${client.id} e setor ${sectorId}:`, error);
        }
      }
    }
  }

  if (createdTickets.length > 0) {
    console.log(`${createdTickets.length} chamados preventivos foram criados.`);
  } else {
    console.log('Nenhum chamado preventivo precisou ser criado hoje.');
  }

  return {
    message: 'Verificação de manutenção preventiva concluída.',
    createdTicketsCount: createdTickets.length,
    checkedClientsCount: clientsSnapshot.size,
  };
}
