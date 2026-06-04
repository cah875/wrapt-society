// Easter eggs: type a name anywhere in the app to summon a full-screen popup.
//
// To add a person: drop an image in /public named after them (lowercase is
// safest), e.g. public/ruger.jpg. No code change needed — the popup tries
// common file extensions automatically.

function imageCandidates(name) {
  const exts = ['gif', 'png', 'jpg', 'jpeg', 'webp'];
  const lower = name.toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  const out = [];
  for (const base of [lower, capitalized]) {
    for (const ext of exts) out.push(`/${base}.${ext}`);
  }
  return out;
}

export const EASTER_EGGS = {
  shawn: {
    name: 'shawn',
    message: 'Made Yoda Happy You Have',
    candidates: ['/yoda.gif'],
  },
  ruger: {
    name: 'ruger',
    message: 'The Force Is Strong With Ruger',
    candidates: imageCandidates('ruger'),
  },
  elizabeth: {
    name: 'elizabeth',
    message: 'The Force Is Strong With Elizabeth',
    candidates: imageCandidates('elizabeth'),
  },
};
