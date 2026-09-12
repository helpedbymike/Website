/* The eight paths. One mindset, different paths.
 *
 * `art` is the shipped file and `remoteArt` the hosted original; whichever
 * loads first wins, and js/art.js generates an emblem if neither is reachable.
 * Run tools/fetch-designs.sh to make the artwork local and drop the remote.
 */

export const PATHS = [
  {
    id: 'family',
    name: 'Family',
    line: 'Protect what matters most.',
    blurb: 'Everything you build is for the people who sit at your table. You do not clock out of this one.',
    creed: 'I am in full custody of the people I protect.',
    art: 'assets/designs/family.png',
    remoteArt: 'https://d8j0ntlcm91z4.cloudfront.net/user_3ImTn7KH4v3UZj21eqFx8tHfRWA/hf_20260912_003800_923f48d9-36bd-4058-be97-bd440ecd8f12.png',
    accent: '#f0c56a',
    glyph: 'M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM4 21v-3a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3'
  },
  {
    id: 'discipline',
    name: 'Discipline',
    line: "Do it when you don't feel like it.",
    blurb: 'Motivation is weather. Discipline is climate. You show up on the days nobody is watching.',
    creed: 'I am in full custody of my standards.',
    art: 'assets/designs/discipline.png',
    remoteArt: 'https://d8j0ntlcm91z4.cloudfront.net/user_3ImTn7KH4v3UZj21eqFx8tHfRWA/hf_20260912_003801_9bb2ddca-f5f8-45fa-96d0-9f0704dfdfb7.png',
    accent: '#cfd6de',
    glyph: 'M3 20h4V10H3v10Zm7 0h4V4h-4v16Zm7 0h4v-7h-4v7Z'
  },
  {
    id: 'purpose',
    name: 'Purpose',
    line: "Know why you're moving.",
    blurb: 'Speed without direction is just noise. You picked a heading and you hold it.',
    creed: 'I am in full custody of my direction.',
    art: 'assets/designs/purpose.png',
    remoteArt: 'https://d8j0ntlcm91z4.cloudfront.net/user_3ImTn7KH4v3UZj21eqFx8tHfRWA/hf_20260912_003801_de524ebe-c5ab-4e19-8ee0-b5f4a6f0236f.png',
    accent: '#e8b661',
    glyph: 'M12 2v20M2 12h20M12 2l3 7-3 3-3-3 3-7Z'
  },
  {
    id: 'faith',
    name: 'Faith',
    line: 'Trust the process. Keep the faith.',
    blurb: 'You keep walking before the proof arrives. That is the whole point of the word.',
    creed: 'I am in full custody of my belief.',
    art: 'assets/designs/faith.png',
    remoteArt: 'https://d8j0ntlcm91z4.cloudfront.net/user_3ImTn7KH4v3UZj21eqFx8tHfRWA/hf_20260912_003801_6c009fe6-218d-4112-8a0a-a4c98c22ef70.png',
    accent: '#f6e2b0',
    glyph: 'M12 2v20M6 8h12'
  },
  {
    id: 'freedom',
    name: 'Freedom',
    line: 'Own your choices.',
    blurb: 'No borrowed permission. No rented life. The road is open and the keys are yours.',
    creed: 'I am in full custody of my choices.',
    art: 'assets/designs/freedom.png',
    remoteArt: 'https://d8j0ntlcm91z4.cloudfront.net/user_3ImTn7KH4v3UZj21eqFx8tHfRWA/hf_20260912_003801_5d843bc4-a0a0-4361-8c25-6cbd96aecd43.png',
    accent: '#d9a55a',
    glyph: 'M5 12h14M13 6l6 6-6 6'
  },
  {
    id: 'passion',
    name: 'Passion',
    line: 'Do what makes you feel alive.',
    blurb: 'The thing you would still do with no audience and no payday. Keep that fire lit.',
    creed: 'I am in full custody of my fire.',
    art: 'assets/designs/passion.png',
    remoteArt: 'https://d8j0ntlcm91z4.cloudfront.net/user_3ImTn7KH4v3UZj21eqFx8tHfRWA/hf_20260912_003801_62ed90b2-e508-4e5f-9630-b04e6bbd311a.png',
    accent: '#ef9b4a',
    glyph: 'M12 2c3 4 6 6 6 10a6 6 0 0 1-12 0c0-4 3-6 6-10Z'
  },
  {
    id: 'growth',
    name: 'Growth',
    line: 'Become a better version of you.',
    blurb: 'Yesterday you is the only competition on the board. Beat him, quietly, again.',
    creed: 'I am in full custody of my becoming.',
    art: 'assets/designs/growth.png',
    remoteArt: 'https://d8j0ntlcm91z4.cloudfront.net/user_3ImTn7KH4v3UZj21eqFx8tHfRWA/hf_20260912_003801_f74adcd6-23be-4913-8614-3ad4fa4f2d5c.png',
    accent: '#a8c98a'
  },
  {
    id: 'legacy',
    name: 'Legacy',
    line: 'Build something that outlives you.',
    blurb: 'Plant the tree you will never sit under. Sign your name on something permanent.',
    creed: 'I am in full custody of what I leave behind.',
    art: 'assets/designs/legacy.png',
    remoteArt: 'https://d8j0ntlcm91z4.cloudfront.net/user_3ImTn7KH4v3UZj21eqFx8tHfRWA/hf_20260912_003801_c37e7a87-a230-4fd1-ae13-9c8f0de87646.png',
    accent: '#c9a15e'
  }
];

export const PATH_BY_ID = Object.fromEntries(PATHS.map(p => [p.id, p]));

/* The feel gate — pick what is loudest right now, get your path. */
export const FEELINGS = [
  { id: 'f1',  text: "I'm doing all of this for them.",        weights: { family: 3, legacy: 1 } },
  { id: 'f2',  text: "I keep hitting snooze on myself.",       weights: { discipline: 3, growth: 1 } },
  { id: 'f3',  text: "I'm moving, but I don't know where.",    weights: { purpose: 3, faith: 1 } },
  { id: 'f4',  text: "I'm carrying something heavy.",          weights: { faith: 3, family: 1 } },
  { id: 'f5',  text: "I'm tired of asking permission.",        weights: { freedom: 3, purpose: 1 } },
  { id: 'f6',  text: "I've gone numb to things I loved.",      weights: { passion: 3, growth: 1 } },
  { id: 'f7',  text: "I've outgrown who I used to be.",        weights: { growth: 3, discipline: 1 } },
  { id: 'f8',  text: "I want to leave a mark that lasts.",     weights: { legacy: 3, purpose: 1 } },
  { id: 'f9',  text: "I'm rebuilding from zero.",              weights: { growth: 2, discipline: 2, faith: 1 } },
  { id: 'f10', text: "I want to be present, not just provide.",weights: { family: 2, purpose: 2 } },
  { id: 'f11', text: "I need something to believe in again.",  weights: { faith: 2, passion: 2 } },
  { id: 'f12', text: "I want my time back.",                   weights: { freedom: 2, legacy: 2 } }
];

export function resolvePath(selectedIds) {
  const score = Object.fromEntries(PATHS.map(p => [p.id, 0]));
  selectedIds.forEach(id => {
    const f = FEELINGS.find(x => x.id === id);
    if (!f) return;
    for (const [path, w] of Object.entries(f.weights)) score[path] += w;
  });
  // stable tie-break: follow the canonical path order
  let best = PATHS[0].id;
  for (const p of PATHS) if (score[p.id] > score[best]) best = p.id;
  const total = Object.values(score).reduce((a, b) => a + b, 0) || 1;
  const ranked = PATHS
    .map(p => ({ id: p.id, pct: Math.round((score[p.id] / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
  return { winner: best, ranked };
}
