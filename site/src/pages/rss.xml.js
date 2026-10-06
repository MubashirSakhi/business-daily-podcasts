import rss from '@astrojs/rss';
import { getEditions, prettyDate } from '../lib';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export async function GET(context) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const abs = (path) => new URL(`${base}/${path}`, context.site).href;
  return rss({
    title: 'Podcast Daily',
    description: 'A daily digest of new episodes from five business and curiosity podcasts.',
    site: context.site,
    items: (await getEditions()).map((ed) => ({
      title: prettyDate(ed.date),
      pubDate: new Date(ed.date + 'T12:00:00Z'),
      link: abs(ed.path),
      description: ed.episodes.map((e) => `${e.show}: ${e.title}`).join(' · '),
      content: ed.episodes.map((e) =>
        `<h2><a href="${abs(e.path)}">${esc(e.title)}</a></h2><p><em>${esc(e.show)}</em></p>` +
        '<ul>' + e.highlights.map((h) => `<li>${esc(h.text)}</li>`).join('') + '</ul>').join(''),
    })),
  });
}
