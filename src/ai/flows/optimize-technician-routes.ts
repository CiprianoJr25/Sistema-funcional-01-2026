// Optimize technician routes flow
'use server';

/**
 * @fileOverview A technician route optimization AI agent.
 *
 * - optimizeTechnicianRoutes - A function that handles the route optimization process.
 * - OptimizeTechnicianRoutesInput - The input type for the optimizeTechnicianRoutes function.
 * - OptimizeTechnicianRoutesOutput - The return type for the optimizeTechnicianRoutes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase/config';

const OptimizeTechnicianRoutesInputSchema = z.object({
  currentLocation: z
    .object({
      latitude: z.number().describe('The current latitude of the technician.'),
      longitude: z.number().describe('The current longitude of the technician.'),
    })
    .describe('The current location of the technician.'),
  ticketAddresses: z
    .array(
      z.object({
        address: z.string().describe('The address of the ticket.'),
        ticketId: z.string().describe('The ID of the ticket.'),
      })
    )
    .describe('A list of ticket addresses to optimize the route for.'),
   userId: z.string().describe("The ID of the user requesting the optimization for logging purposes."),
});
export type OptimizeTechnicianRoutesInput = z.infer<
  typeof OptimizeTechnicianRoutesInputSchema
>;

const OptimizeTechnicianRoutesOutputSchema = z.object({
  optimizedRoute: z
    .array(
      z.object({
        ticketId: z.string().describe('The ID of the ticket.'),
        address: z.string().describe('The address of the ticket.'),
      })
    )
    .describe('The optimized route for the technician.'),
  explanation: z
    .string()
    .describe('A brief explanation of how the route was optimized, in brazilian portuguese.'),
});
export type OptimizeTechnicianRoutesOutput = z.infer<
  typeof OptimizeTechnicianRoutesOutputSchema
>;

export async function optimizeTechnicianRoutes(
  input: OptimizeTechnicianRoutesInput
): Promise<OptimizeTechnicianRoutesOutput> {
  return optimizeTechnicianRoutesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeTechnicianRoutesPrompt',
  input: {schema: OptimizeTechnicianRoutesInputSchema},
  output: {schema: OptimizeTechnicianRoutesOutputSchema},
  prompt: `You are an expert route optimization specialist. Your answers must be in brazilian portuguese.

Given the technician's current location and a list of ticket addresses, you will determine the optimal route to minimize travel time and distance.

Current Location: Latitude: {{{currentLocation.latitude}}}, Longitude: {{{currentLocation.longitude}}}

Ticket Addresses:
{{#each ticketAddresses}}
- Ticket ID: {{{ticketId}}}, Address: {{{address}}}
{{/each}}

Consider factors such as distance, traffic conditions, and one-way streets to create the most efficient route.

Output the optimized route as a list of ticket IDs and addresses in the order they should be visited, and a brief explanation of how the route was optimized in brazilian portuguese.

Make sure the optimizedRoute array contains all the ticketAddresses passed in.

Example output:
{
  "optimizedRoute": [
    { "ticketId": "1", "address": "123 Main St" },
    { "ticketId": "2", "address": "456 Elm St" },
    { "ticketId": "3", "address": "789 Oak St" }
  ],
  "explanation": "A rota foi otimizada com base na menor distância entre cada local, partindo da localização atual do técnico."
}
`,
});

const optimizeTechnicianRoutesFlow = ai.defineFlow(
  {
    name: 'optimizeTechnicianRoutesFlow',
    inputSchema: OptimizeTechnicianRoutesInputSchema,
    outputSchema: OptimizeTechnicianRoutesOutputSchema,
  },
  async input => {
    // Log the AI call event
    try {
        await addDoc(collection(db, "system-logs"), {
            userId: input.userId,
            event: 'AI_CALL',
            flowName: 'optimizeTechnicianRoutesFlow',
            timestamp: new Date().toISOString(),
            details: {
                ticketCount: input.ticketAddresses.length,
            }
        });
    } catch (error) {
        console.warn("Could not log AI call to Firestore:", error);
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
