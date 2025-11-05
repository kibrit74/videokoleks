'use server';

/**
 * @fileOverview Automatically categorizes videos using AI.
 *
 * This file defines a Genkit flow that takes a video title and description
 * as input and returns a suggested category for the video.
 *
 * @module src/ai/flows/auto-categorize-videos
 *
 * @interface AutoCategorizeVideosInput - The input type for the autoCategorizeVideos function.
 * @interface AutoCategorizeVideosOutput - The output type for the autoCategorizeVideos function.
 * @function autoCategorizeVideos - The main function to categorize videos.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoCategorizeVideosInputSchema = z.object({
  title: z.string().describe('The title of the video.'),
  description: z.string().describe('A description of the video.'),
});

export type AutoCategorizeVideosInput = z.infer<
  typeof AutoCategorizeVideosInputSchema
>;

const AutoCategorizeVideosOutputSchema = z.object({
  category: z.string().describe('The suggested category for the video.'),
});

export type AutoCategorizeVideosOutput = z.infer<
  typeof AutoCategorizeVideosOutputSchema
>;

export async function autoCategorizeVideos(
  input: AutoCategorizeVideosInput
): Promise<AutoCategorizeVideosOutput> {
  return autoCategorizeVideosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoCategorizeVideosPrompt',
  input: {schema: AutoCategorizeVideosInputSchema},
  output: {schema: AutoCategorizeVideosOutputSchema},
  prompt: `You are an expert video content categorizer. Based on the title and description of the video, suggest a relevant category for the video.  The category should be a single word or short phrase.

Title: {{{title}}}
Description: {{{description}}}

Category:`, // Keep the prompt as concise as possible.
});

const autoCategorizeVideosFlow = ai.defineFlow(
  {
    name: 'autoCategorizeVideosFlow',
    inputSchema: AutoCategorizeVideosInputSchema,
    outputSchema: AutoCategorizeVideosOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
