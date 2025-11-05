'use server';

/**
 * @fileOverview A Genkit flow for suggesting relevant categories for a video based on its content.
 *
 * - generateCategorySuggestions - A function that takes a video description and suggests relevant categories.
 * - GenerateCategorySuggestionsInput - The input type for the generateCategorySuggestions function.
 * - GenerateCategorySuggestionsOutput - The return type for the generateCategorySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCategorySuggestionsInputSchema = z.object({
  videoDescription: z
    .string()
    .describe('The description of the video content.'),
});

export type GenerateCategorySuggestionsInput = z.infer<
  typeof GenerateCategorySuggestionsInputSchema
>;

const GenerateCategorySuggestionsOutputSchema = z.object({
  suggestedCategories: z
    .array(z.string())
    .describe('An array of suggested categories for the video.'),
});

export type GenerateCategorySuggestionsOutput = z.infer<
  typeof GenerateCategorySuggestionsOutputSchema
>;

export async function generateCategorySuggestions(
  input: GenerateCategorySuggestionsInput
): Promise<GenerateCategorySuggestionsOutput> {
  return generateCategorySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCategorySuggestionsPrompt',
  input: {schema: GenerateCategorySuggestionsInputSchema},
  output: {schema: GenerateCategorySuggestionsOutputSchema},
  prompt: `You are an expert in video categorization. Based on the following video description, suggest a list of relevant categories.

Video Description: {{{videoDescription}}}

Categories:`, //Crucially, the Handlebars templating is properly used.
});

const generateCategorySuggestionsFlow = ai.defineFlow(
  {
    name: 'generateCategorySuggestionsFlow',
    inputSchema: GenerateCategorySuggestionsInputSchema,
    outputSchema: GenerateCategorySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
