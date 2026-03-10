export const ABILITY_LABELS = [
  "Kraft",
  "Explosive Strength",
  "Technik",
  "Körperspannung",
  "Mobilität",
  "Balance",
  "Mentalität",
];

export const STYLE_LABELS = ["Crimper", "Sloper", "Slab", "Dyno", "Pocket"];

export const ABILITY_COUNT = ABILITY_LABELS.length;
export const STYLE_COUNT = STYLE_LABELS.length;
export const MAX_ABILITY_LEVEL = 24;
export const DEFAULT_ABILITY_LEVEL = 12;
export const DEFAULT_STYLE_LEVEL = 12;

const LEGACY_ABILITY_COUNT = 5;
const LEGACY_TO_NEW_ABILITY_INDEX = {
  0: 0,
  1: 4,
  2: 6,
  3: 1,
  4: 3,
};

function toBoundedInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function normalizeAbilities(abilities, fallback = DEFAULT_ABILITY_LEVEL) {
  if (Array.isArray(abilities) && abilities.length === ABILITY_COUNT) {
    return abilities.map((value) => toBoundedInt(value, 0, MAX_ABILITY_LEVEL, fallback));
  }

  if (Array.isArray(abilities) && abilities.length === LEGACY_ABILITY_COUNT) {
    const migrated = Array(ABILITY_COUNT).fill(fallback);
    abilities.forEach((value, oldIndex) => {
      const targetIndex = LEGACY_TO_NEW_ABILITY_INDEX[oldIndex];
      if (targetIndex !== undefined) {
        migrated[targetIndex] = toBoundedInt(value, 0, MAX_ABILITY_LEVEL, fallback);
      }
    });

    const mobility = migrated[4];
    migrated[2] = mobility;
    migrated[5] = mobility;
    return migrated;
  }

  return Array(ABILITY_COUNT).fill(fallback);
}

export function normalizeStyles(styles, fallback = DEFAULT_STYLE_LEVEL) {
  if (Array.isArray(styles) && styles.length === STYLE_COUNT) {
    return styles.map((value) => toBoundedInt(value, 0, Number.MAX_SAFE_INTEGER, fallback));
  }

  return Array(STYLE_COUNT).fill(fallback);
}

export function normalizeProfileSchema(profile = {}) {
  const normalizedAbilities = normalizeAbilities(profile.abilities);
  const normalizedStyles = normalizeStyles(profile.styles);

  return {
    ...profile,
    abilities: normalizedAbilities,
    styles: normalizedStyles,
  };
}

export function hasExpectedArrayLengths(profile = {}) {
  const abilitiesOk = Array.isArray(profile.abilities) && profile.abilities.length === ABILITY_COUNT;
  const stylesOk = Array.isArray(profile.styles) && profile.styles.length === STYLE_COUNT;

  return { abilitiesOk, stylesOk };
}

export function needsAbilityMigration(abilities) {
  return Array.isArray(abilities) && abilities.length === LEGACY_ABILITY_COUNT;
}
