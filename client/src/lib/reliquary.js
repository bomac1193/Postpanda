// Reliquary v2 — Pack-based Secret Relic Collections

export const RELIC_PACKS = [
  {
    id: 'scattered-collection',
    name: 'The Scattered Collection',
    description: 'Twelve relics found across London, each stranger than the last.',
    hashedPassword: '4775e2615140c36b5a8af94f45cce8df1e6febb4f3e67ff9720092c860327315',
    relics: [
      {
        id: 'one-armed-mannequin',
        name: 'One-Armed Mannequin',
        description: 'Salvaged from a Mayfair window display during a blackout.',
        lore: 'The missing arm was never found — only a handwritten note reading "I gave it willingly."',
        tier: 1,
        icon: '🦾',
      },
      {
        id: 'gucci-incense',
        name: 'Gucci Incense',
        description: 'A stick of Nag Champa wrapped in a torn Gucci label.',
        lore: 'Burns with the scent of ambition and sandalwood.',
        tier: 1,
        icon: '🪔',
      },
      {
        id: '8-legged-harrods-tripod',
        name: '8-Legged Harrods Tripod',
        description: 'A camera tripod modified with five extra legs by an unknown Harrods employee.',
        lore: 'No one knows why. It stands perfectly still on any surface.',
        tier: 1,
        icon: '🕷️',
      },
      {
        id: 'stilettos-uber-driver',
        name: 'Stilettos Stolen from a One-Eyed Uber Driver',
        description: 'Size 7. Patent leather. Found on the backseat of a cancelled ride.',
        lore: "The driver's one eye was reportedly his best feature.",
        tier: 1,
        icon: '👠',
      },
      {
        id: 'starbucks-bando-pin',
        name: 'Starbucks Bando ID Pin',
        description: "An employee name tag reading 'BANDO'.",
        lore: 'No such employee exists in any Starbucks database. The pin radiates faint warmth.',
        tier: 2,
        icon: '📛',
      },
      {
        id: 'versace-brick',
        name: 'The Versace Brick',
        description: 'A house brick wrapped in authentic Versace silk.',
        lore: 'Used as a doorstop at an unlicensed salon in Peckham since 2014.',
        tier: 2,
        icon: '🧱',
      },
      {
        id: 'balenciaga-prayer-mat',
        name: 'Balenciaga Prayer Mat',
        description: 'Triple-stitched. Found rolled up inside a bass bin at a Dalston warehouse rave.',
        lore: 'Smells of fog machine fluid.',
        tier: 2,
        icon: '🧎',
      },
      {
        id: 'tesco-finest-monocle',
        name: 'Tesco Finest Monocle',
        description: 'A single corrective lens mounted in a gold-plated Tesco Clubcard.',
        lore: 'Prescription unknown. Grants clarity of taste.',
        tier: 2,
        icon: '🧐',
      },
      {
        id: 'severed-aux-cable',
        name: 'The Severed Aux Cable of Brixton',
        description: 'Cut mid-song during a legendary sound clash.',
        lore: 'Both halves still carry signal if held by someone worthy.',
        tier: 3,
        icon: '🔌',
      },
      {
        id: 'hermes-oyster-card',
        name: 'Hermes Oyster Card',
        description: 'A Zone 1-6 travelcard inside an Hermes leather case.',
        lore: 'Has never been topped up, yet never runs out.',
        tier: 3,
        icon: '💳',
      },
      {
        id: 'fendi-frying-pan',
        name: 'The Fendi Frying Pan',
        description: 'Cast iron, Fendi-stamped handle.',
        lore: 'Used to cook a full English at London Fashion Week 2019. Grease stains are part of the patina.',
        tier: 3,
        icon: '🍳',
      },
      {
        id: 'off-white-traffic-cone',
        name: 'Off-White Traffic Cone',
        description: "Virgil's unreleased collab with TfL.",
        lore: 'The quotation marks read "CAUTION". Found outside a chicken shop in Tottenham.',
        tier: 3,
        icon: '🔶',
      },
    ],
  },
];

export async function hashPassword(plaintext) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Try a password against all locked packs, return the pack id or null
export async function tryUnlockPack(plaintext, currentUnlocks) {
  const hash = await hashPassword(plaintext);
  for (const pack of RELIC_PACKS) {
    if (!currentUnlocks[pack.id] && hash === pack.hashedPassword) {
      return pack.id;
    }
  }
  return null;
}
