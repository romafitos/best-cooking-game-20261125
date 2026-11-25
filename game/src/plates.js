// Plates: one job — what is on the pass. Matching a plate to a recipe,
// adding a component, and lifting a finished dish off it.
import { RECIPES } from './config.js';

export function componentKey(component) {
  return `${component.ing}:${component.stage}`;
}

export function recipeKey(recipe) {
  return recipe.needs.map(componentKey).sort().join('|');
}

export function plateMatches(plate, recipe) {
  if (plate.items.length !== recipe.needs.length) return false;
  return plate.items.map(componentKey).sort().join('|') === recipeKey(recipe);
}

export function plateRecipe(plate) {
  for (const recipe of RECIPES) {
    if (plateMatches(plate, recipe)) return recipe;
  }
  return null;
}

export function isPlateable(item) {
  return !!item && !item.dish && (item.stage === 'chopped' || item.stage === 'wokked' || item.stage === 'steamed');
}

// The usable plates: the first `state.plateSlots` of the pass.
export function openPlates(state) {
  return state.plates.slice(0, state.plateSlots);
}

// Put a component on the first open plate that has room and lacks it.
// Returns the plate it went on, or null.
export function addToPlate(state, item) {
  const key = componentKey(item);
  for (const plate of openPlates(state)) {
    if (plate.items.length < 3 && !plate.items.some((c) => componentKey(c) === key)) {
      plate.items.push(item);
      return plate;
    }
  }
  return null;
}

// Lift the first finished dish off the pass, clearing its plate.
export function takeFinishedDish(state) {
  for (const plate of openPlates(state)) {
    const recipe = plateRecipe(plate);
    if (recipe) {
      plate.items = [];
      return { dish: recipe.id, name: recipe.name };
    }
  }
  return null;
}
