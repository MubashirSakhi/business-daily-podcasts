import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import topics from './data/topics.json';

export const CATEGORIES = ['Startup Idea', 'Business Model', 'Trivia', 'Technical Wisdom', 'Investing', 'Marketing/Growth', 'Life/Career Advice'] as const;
export const SHOWS = ['My First Million', 'Planet Money', 'Stuff You Should Know', "What's Your Problem", 'Masters of Scale'] as const;
const TOPICS = topics.map((t) => t.name) as [string, ...string[]];

// A bad daily paste (unknown show/category/topic, missing field) fails the build instead of shipping.
const editions = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/editions' }),
  schema: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    episodes: z.array(z.object({
      show: z.enum(SHOWS),
      title: z.string().min(1),
      url: z.string().url(),
      recap: z.array(z.string()).min(1),
      fun_facts: z.array(z.string()),
      discussion_questions: z.array(z.string()),
      highlights: z.array(z.object({
        text: z.string().min(1),
        category: z.enum(CATEGORIES),
        topics: z.array(z.enum(TOPICS)).min(1).max(3),
      })).min(1),
    })).min(1),
  }),
});

export const collections = { editions };
