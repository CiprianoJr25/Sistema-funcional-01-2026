
'use server';

/**
 * @fileOverview A flow to generate a summary report of tickets using AI.
 *
 * - generateTicketReportSummary - A function that analyzes ticket data and returns a summary.
 * - GenerateTicketReportSummaryInput - The input type for the function.
 * - TicketReportSummary - The return type (output) for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Define the schema for the input data.
const GenerateTicketReportSummaryInputSchema = z.object({
  externalTickets: z.array(z.any()).describe('List of external tickets.'),
  internalTickets: z.array(z.any()).describe('List of internal tickets.'),
  users: z.array(z.any()).describe('List of all users for context.'),
  sectors: z.array(z.any()).describe('List of all sectors for context.'),
  context: z.string().describe('Context about who is requesting the report and for which scope (e.g., entire company, specific sector).'),
  userId: z.string().describe('ID of the user requesting the report for logging purposes.'),
});
export type GenerateTicketReportSummaryInput = z.infer<typeof GenerateTicketReportSummaryInputSchema>;

// Define the schema for the output data. This gives the AI a structure to follow.
const TicketReportSummarySchema = z.object({
  summaryAndTrends: z
    .string()
    .describe(
      'A general summary of the provided tickets in brazilian portuguese, presented in clear, objective markdown. Identify key trends, most common problems, sectors with the most tickets, and technicians with the highest volume.'
    ),
  improvementSuggestions: z
    .string()
    .describe(
      'Actionable suggestions for improvement based on the data in brazilian portuguese, presented in clear, objective markdown. This could include process changes, training for specific technicians, or resource allocation.'
    ),
});
export type TicketReportSummary = z.infer<typeof TicketReportSummarySchema>;

// Exported function that the UI will call.
export async function generateTicketReportSummary(
  input: GenerateTicketReportSummaryInput
): Promise<TicketReportSummary> {
  return generateTicketReportSummaryFlow(input);
}

// Define the Genkit prompt.
const prompt = ai.definePrompt({
  name: 'generateTicketReportSummaryPrompt',
  input: { schema: GenerateTicketReportSummaryInputSchema },
  output: { schema: TicketReportSummarySchema },
  prompt: `
    You are an expert operations analyst for a technical service company. Your task is to analyze the provided ticket data and generate a concise, insightful report in Brazilian Portuguese, formatted in Markdown.

    CONTEXT: {{{context}}}

    Analyze the following data:
    - External Tickets: A list of customer-facing service orders.
    - Internal Tickets: A list of internal tasks and reminders.
    - Users & Sectors: Data to map IDs to names.

    Your report MUST contain two sections formatted as clean and objective Markdown lists:
    1.  **Sumário Geral e Tendências:**
        - Provide a high-level overview of the tickets.
        - What are the most common ticket descriptions or problems? (e.g., "- Problema mais comum: Falha de conexão de rede.")
        - Which sectors have the most open or concluded tickets? (e.g., "- Setor com mais chamados: Vendas.")
        - Are there technicians with a significantly higher number of assigned or completed tickets? (e.g., "- Técnico com mais conclusões: João Silva.")
        - Identify any recurring patterns (e.g., many 'retorno' tickets, many 'urgente' tickets).

    2.  **Sugestões de Melhoria:**
        - Based on your analysis, provide actionable suggestions in a list format.
        - Example: "- **Treinamento:** Notamos que o Setor de Vendas possui um alto volume de chamados relacionados a impressoras. Sugerimos um treinamento de uso básico para a equipe."
        - Example: "- **Reconhecimento:** O técnico João Silva concluiu 30% a mais de chamados que a média. Podemos usar suas técnicas para treinar outros membros da equipe."

    Present the output clearly using Markdown for lists, bold text, and headers. The output for each field should be a single string containing the markdown.
    
    Here is the data to analyze:
    
    External Tickets:
    {{#each externalTickets}}
    - ID: {{{id}}}, Cliente: {{{client.name}}}, Descrição: {{{description}}}, Status: {{{status}}}, Tipo: {{{type}}}, Criado em: {{{createdAt}}}, Técnico ID: {{{technicianId}}}, Setor ID: {{{sectorId}}}
    {{/each}}

    Internal Tickets:
    {{#each internalTickets}}
    - ID: {{{id}}}, Título: {{{title}}}, Status: {{{status}}}, Criado em: {{{createdAt}}}, Responsável ID: {{{assigneeId}}}, Setor ID: {{{sectorId}}}
    {{/each}}

    Users:
    {{#each users}}
    - ID: {{{id}}}, Nome: {{{name}}}, Cargo: {{{role}}}
    {{/each}}

    Sectors:
    {{#each sectors}}
    - ID: {{{id}}}, Nome: {{{name}}}
    {{/each}}
    `,
});

// Define the Genkit flow.
const generateTicketReportSummaryFlow = ai.defineFlow(
  {
    name: 'generateTicketReportSummaryFlow',
    inputSchema: GenerateTicketReportSummaryInputSchema,
    outputSchema: TicketReportSummarySchema,
  },
  async (input) => {
    try {
        await addDoc(collection(db, "system-logs"), {
            userId: input.userId,
            event: 'AI_CALL',
            flowName: 'generateTicketReportSummaryFlow',
            timestamp: new Date().toISOString(),
            details: {
                context: input.context,
                externalTicketsCount: input.externalTickets.length,
                internalTicketsCount: input.internalTickets.length,
            }
        });
    } catch (error) {
        console.warn("Could not log AI call to Firestore:", error);
    }
    
    const { output } = await prompt(input);
    return output!;
  }
);
