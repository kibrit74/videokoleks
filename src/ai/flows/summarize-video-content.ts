'use server';

/**
 * @fileOverview A flow that summarizes video content.
 *
 * - summarizeVideoContent - A function that summarizes video content.
 * - SummarizeVideoContentInput - The input type for the summarizeVideoContent function.
 * - SummarizeVideoContentOutput - The return type for the summarizeVideoContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeVideoContentInputSchema = z.object({
  videoTitle: z.string().describe('The title of the video.'),
  videoDescription: z.string().describe('The description of the video.'),
  videoTags: z.string().describe('The tags associated with the video.'),
});
export type SummarizeVideoContentInput = z.infer<
  typeof SummarizeVideoContentInputSchema
>;

const SummarizeVideoContentOutputSchema = z.object({
  summary: z.string().describe('A short summary of the video content.'),
});
export type SummarizeVideoContentOutput = z.infer<
  typeof SummarizeVideoContentOutputSchema
>;

export async function summarizeVideoContent(
  input: SummarizeVideoContentInput
): Promise<SummarizeVideoContentOutput> {
  return summarizeVideoContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeVideoContentPrompt',
  input: {schema: SummarizeVideoContentInputSchema},
  output: {schema: SummarizeVideoContentOutputSchema},
  prompt: `You are an AI expert in summarizing video content. You will be provided with the video title, description, and tags. Your goal is to generate a concise summary of the video's content.

Video Title: {{{videoTitle}}}
Video Description: {{{videoDescription}}}
Video Tags: {{{videoTags}}}

Summary: `,
});

const summarizeVideoContentFlow = ai.defineFlow(
  {
    name: 'summarizeVideoContentFlow',
    inputSchema: SummarizeVideoContentInputSchema,
    outputSchema: SummarizeVideoContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
