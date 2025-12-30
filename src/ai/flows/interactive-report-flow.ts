
'use server';
/**
 * @fileOverview Um fluxo de IA para responder perguntas sobre os dados do aplicativo.
 *
 * - interactiveReportFlow - Responde a uma pergunta do usuário buscando dados relevantes.
 * - InteractiveReportInput - O tipo de entrada para a função.
 * - InteractiveReportOutput - O tipo de saída para a função.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase/config';

const InteractiveReportInputSchema = z.object({
  question: z.string().describe('A pergunta do usuário em linguagem natural.'),
  externalTickets: z.array(z.any()).describe('Lista de todos os chamados externos para análise.'),
  internalTickets: z.array(z.any()).describe('Lista de todos os atendimentos internos para análise.'),
  users: z.array(z.any()).describe('Lista de todos os usuários (técnicos, gerentes, etc.).'),
  sectors: z.array(z.any()).describe('Lista de todos os setores.'),
  userId: z.string().describe('ID do usuário que está fazendo a pergunta.'),
});
export type InteractiveReportInput = z.infer<typeof InteractiveReportInputSchema>;

const InteractiveReportOutputSchema = z.object({
  answer: z.string().describe('A resposta para a pergunta do usuário, formatada em markdown.'),
});
export type InteractiveReportOutput = z.infer<typeof InteractiveReportOutputSchema>;

export async function askInteractiveReport(
  input: InteractiveReportInput
): Promise<InteractiveReportOutput> {
  return interactiveReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interactiveReportPrompt',
  input: { schema: InteractiveReportInputSchema },
  output: { schema: InteractiveReportOutputSchema },
  prompt: `
    Você é um analista de dados especialista no sistema Nexus Service. Sua função é responder a perguntas sobre os dados operacionais da empresa de forma clara e concisa em português do Brasil.

    Use os dados fornecidos para responder à pergunta do usuário. Seja direto e, se necessário, use listas ou negrito para formatar a resposta em markdown.

    Pergunta do Usuário:
    "{{{question}}}"

    DADOS PARA ANÁLISE:
    ---
    Usuários (Técnicos, Gerentes, etc.):
    {{#each users}}
    - ID: {{{id}}}, Nome: {{{name}}}, Cargo: {{{role}}}
    {{/each}}
    ---
    Setores:
    {{#each sectors}}
    - ID: {{{id}}}, Nome: {{{name}}}
    {{/each}}
    ---
    Chamados Externos:
    {{#each externalTickets}}
    - ID: {{{id}}}, Cliente: {{{client.name}}}, Descrição: {{{description}}}, Status: {{{status}}}, Tipo: {{{type}}}, Criado em: {{{createdAt}}}, Concluído em: {{{updatedAt}}}, Técnico ID: {{{technicianId}}}, Setor ID: {{{sectorId}}}
    {{/each}}
    ---
    Atendimentos Internos:
    {{#each internalTickets}}
    - ID: {{{id}}}, Título: {{{title}}}, Status: {{{status}}}, Criado em: {{{createdAt}}}, Concluído em: {{{updatedAt}}}, Responsável ID: {{{assigneeId}}}, Setor ID: {{{sectorId}}}
    {{/each}}
    ---

    Baseado nos dados acima, responda à pergunta do usuário. Se a pergunta for sobre um período de tempo (ex: "esta semana", "hoje"), considere a data atual como ${new Date().toLocaleDateString('pt-BR')}.
  `,
});

const interactiveReportFlow = ai.defineFlow(
  {
    name: 'interactiveReportFlow',
    inputSchema: InteractiveReportInputSchema,
    outputSchema: InteractiveReportOutputSchema,
  },
  async (input) => {
     try {
        await addDoc(collection(db, "system-logs"), {
            userId: input.userId,
            event: 'AI_CALL',
            flowName: 'interactiveReportFlow',
            timestamp: new Date().toISOString(),
            details: {
                question: input.question,
            }
        });
    } catch (error) {
        console.warn("Could not log AI call to Firestore:", error);
    }

    const { output } = await prompt(input);
    return output!;
  }
);
