// Canonical static rules facade for the modular Worker architecture.
// Keep request, database, and runtime state out of this module.
export {
  GENERAL_PRODUCTIONS,
  SPECIAL_PRODUCTIONS,
  REGION_MULTIPLIERS,
  GENERAL_CAMPS,
  SPECIAL_CAMPS,
  SHIP_CAPACITY,
  EQUIPMENT,
  EQUIPMENT_UPGRADE_COST,
  RESOURCE_KEYS,
  RESOURCE_LABELS,
  WAR_LORDS
} from "../data/game-rules.js";

export const NAVAL_CASTLES = new Set([
  "Eastwatch", "Karhold", "Seagard", "Gulltown", "Pyke", "Ten Towers",
  "Hammerhorn", "Casterly Rock", "King's Landing", "Dragonstone",
  "Storm's End", "Oldtown", "Sunspear", "Yronwood"
]);

export function gameRegions(houses) {
  return houses.map(({ region }) => region);
}
