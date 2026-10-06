import { getCollection } from 'astro:content';
import topicRegistry from './data/topics.json';

export const SHOW_BADGE: Record<string, string> = {
  'My First Million': 'mfm', 'Planet Money': 'pm', 'Stuff You Should Know': 'sysk',
  "What's Your Problem": 'wyp', 'Masters of Scale': 'mos',
};

export const slug = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

export const url = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

export const prettyDate = (date: string) =>
  new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// ponytail: only **bold** is supported in recap paragraphs; that is all the digest skill emits.
export const md = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

export async function getEditions() {
  const entries = await getCollection('editions');
  return entries.map((e) => e.data).sort((a, b) => b.date.localeCompare(a.date)).map((ed) => {
    const path = ed.date.replace(/-/g, '/') + '/';
    const seen = new Set<string>();
    const episodes = ed.episodes.map((ep) => {
      let s = slug(ep.title);
      while (seen.has(s)) s += '-2';
      seen.add(s);
      const tags = [...new Set(ep.highlights.map((h) => h.category))];
      const topics = [...new Set(ep.highlights.flatMap((h) => h.topics))];
      return { ...ep, slug: s, path: path + s + '/', date: ed.date, tags, topics };
    });
    return { ...ed, path, episodes };
  });
}

export type Episode = Awaited<ReturnType<typeof getEditions>>[number]['episodes'][number];

export async function getHighlights() {
  return (await getEditions()).flatMap((ed) => ed.episodes.flatMap((ep) => ep.highlights.map((h) => ({ ...h, episode: ep }))));
}

export const topicNames = topicRegistry.map((t) => t.name);
