import { Player } from "../../domain/entities/Player";
import { Hero } from "../../domain/entities/HeroStats";

export type SpecialId =
  // Guerrero Tanque
  | "GOLPE_ESCUDO" | "MANO_PIEDRA" | "DEFENSA_FEROZ"
  // Guerrero Armas
  | "EMBATE_SANGRIENTO" | "LANZA_DIOSES" | "GOLPE_TORMENTA"
  // Mago Fuego
  | "MISILES_MAGMA" | "VULCANO" | "PARED_FUEGO"
  // Mago Hielo
  | "LLUVIA_HIELO" | "CONO_HIELO" | "BOLA_HIELO"
  // Pícaro Veneno
  | "FLOR_LOTO" | "AGONIA" | "PIQUETE"
  // Pícaro Machete
  | "CORTADA" | "MACHETAZO" | "PLANAZO"
  // Chamán
  | "TOQUE_VIDA" | "VINCULO_NATURAL" | "CANTO_BOSQUE"
  // Médico
  | "CURACION_DIRECTA" | "NEUTRALIZACION_EFECTOS" | "REANIMACION";

export interface SpecialOutcome {
  /** Buffs que se aplican al ACTOR y duran hasta su próximo turno */
  tempAttack?: number;       // +ATK para chequeo vs DEF y cálculos del básico
  tempDefense?: number;      // +DEF del actor (inmunidades modeladas como DEF alta)
  flatDamageBonus?: number;  // +X al daño básico (se suma a min/max para este tiempo)
  /** Curaciones */
  healTarget?: number;       // cura directa a target aliado
  healGroup?: number;        // cura a todos los aliados del actor
  setToFull?: boolean;       // levantar a full vida (target aliado)
  /** Administrativo */
  powerSpent: number;
  label: string;
}

function randInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Normaliza un nombre de special a ID tipo SNAKE_CASE sin tildes */
function toId(name: string): string {
  return (name || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().replace(/\s+/g, "_").toUpperCase();
}

function ensureAndSpendPower(hero: Hero, cost: number): number {
  const cur = hero.power ?? 0;
  if (cur < cost) throw new Error("Not enough power to use this skill");
  hero.power = cur - cost;
  return cost;
}

/** Marca en el arreglo `specialActions` el cooldown de “un turno de carga” */
function putOnCooldownById(hero: Hero, specialId: SpecialId, turns: number = 1) {
  const list = hero.specialActions || [];
  const found = list.find(s => toId(s.name) === specialId || s.name === (specialId as any));
  if (found) {
    found.isAvailable = false;
    found.cooldown = turns; // no disponible el siguiente turno del mismo actor
  }
}

export default class SpecialSkillService {
  public static resolveSpecial(source: Player, specialId: SpecialId): SpecialOutcome {
    const hero = source.heroStats.hero;

    switch (specialId) {
      // === Guerrero Tanque ===
      case "GOLPE_ESCUDO": {
        const cost = ensureAndSpendPower(hero, 2);
        putOnCooldownById(hero, specialId);
        return { tempAttack: 2, powerSpent: cost, label: "Golpe con escudo (+2 ATQ)" };
      }
      case "MANO_PIEDRA": {
        const cost = ensureAndSpendPower(hero, 4);
        putOnCooldownById(hero, specialId);
        return { tempDefense: 12, powerSpent: cost, label: "Mano de piedra (+12 DEF)" };
      }
      case "DEFENSA_FEROZ": {
        const cost = ensureAndSpendPower(hero, 6);
        putOnCooldownById(hero, specialId);
        return { tempDefense: 999, powerSpent: cost, label: "Defensa feroz (Inmune al daño)" };
      }

      // === Guerrero Armas ===
      case "EMBATE_SANGRIENTO": {
        const cost = ensureAndSpendPower(hero, 4);
        putOnCooldownById(hero, specialId);
        return { tempAttack: 2, flatDamageBonus: 1, powerSpent: cost, label: "Embate sangriento (+2 ATQ, +1 DMG)" };
      }
      case "LANZA_DIOSES": {
        const cost = ensureAndSpendPower(hero, 4);
        putOnCooldownById(hero, specialId);
        return { flatDamageBonus: 2, powerSpent: cost, label: "Lanza de los dioses (+2 DMG)" };
      }
      case "GOLPE_TORMENTA": {
        const cost = ensureAndSpendPower(hero, 6);
        putOnCooldownById(hero, specialId);
        const tempAtk = randInRange(3, 18); // ~3d6
        return { tempAttack: tempAtk, flatDamageBonus: 2, powerSpent: cost, label: "Golpe de tormenta" };
      }

      // === Mago Fuego ===
      case "MISILES_MAGMA": {
        const cost = ensureAndSpendPower(hero, 2);
        putOnCooldownById(hero, specialId);
        return { tempAttack: 1, flatDamageBonus: 2, powerSpent: cost, label: "Misiles de magma" };
      }
      case "VULCANO": {
        const cost = ensureAndSpendPower(hero, 6);
        putOnCooldownById(hero, specialId);
        const extra = randInRange(3, 27); // ~3d9
        return { tempAttack: 3, flatDamageBonus: extra, powerSpent: cost, label: "Vulcano" };
      }
      case "PARED_FUEGO": {
        const cost = ensureAndSpendPower(hero, 4);
        putOnCooldownById(hero, specialId);
        return { tempAttack: 1, powerSpent: cost, label: "Pared de fuego (+1 ATQ) /*TODO*/" };
      }

      // === Mago Hielo ===
      case "LLUVIA_HIELO": {
        const cost = ensureAndSpendPower(hero, 2);
        putOnCooldownById(hero, specialId);
        return { tempAttack: 2, flatDamageBonus: 2, powerSpent: cost, label: "Lluvia de hielo" };
      }
      case "CONO_HIELO": {
        const cost = ensureAndSpendPower(hero, 6);
        putOnCooldownById(hero, specialId);
        return { flatDamageBonus: 2, powerSpent: cost, label: "Cono de hielo (+2 DMG)" };
      }
      case "BOLA_HIELO": {
        const cost = ensureAndSpendPower(hero, 4);
        putOnCooldownById(hero, specialId);
        return { tempAttack: 2, powerSpent: cost, label: "Bola de hielo (+2 ATQ)" };
      }

      // === Pícaro Veneno ===
      case "FLOR_LOTO": {
        const cost = ensureAndSpendPower(hero, 2);
        putOnCooldownById(hero, specialId);
        const extra = randInRange(4, 32); // ~4d8
        return { flatDamageBonus: extra, powerSpent: cost, label: "Flor de loto" };
      }
      case "AGONIA": {
        const cost = ensureAndSpendPower(hero, 4);
        putOnCooldownById(hero, specialId);
        const extra = randInRange(2, 18); // ~2d9
        return { flatDamageBonus: extra, powerSpent: cost, label: "Agonía" };
      }
      case "PIQUETE": {
        const cost = ensureAndSpendPower(hero, 4);
        putOnCooldownById(hero, specialId);
        return { tempAttack: 1, flatDamageBonus: 2, powerSpent: cost, label: "Piquete (+1 ATQ, +2 DMG este turno)" };
      }

      // === Pícaro Machete ===
      case "CORTADA": {
        const cost = ensureAndSpendPower(hero, 2);
        putOnCooldownById(hero, specialId);
        return { flatDamageBonus: 2, powerSpent: cost, label: "Cortada (+2 DMG)" };
      }
      case "MACHETAZO": {
        const cost = ensureAndSpendPower(hero, 4);
        putOnCooldownById(hero, specialId);
        const extra = randInRange(2, 16); // ~2d8
        return { tempAttack: 1, flatDamageBonus: extra, powerSpent: cost, label: "Machetazo" };
      }
      case "PLANAZO": {
        const cost = ensureAndSpendPower(hero, 4);
        putOnCooldownById(hero, specialId);
        const atk = randInRange(2, 16); // ~2d8
        return { tempAttack: atk, flatDamageBonus: 1, powerSpent: cost, label: "Planazo" };
      }

      // === Chamán ===
      case "TOQUE_VIDA": {
        const cost = ensureAndSpendPower(hero, 2);
        putOnCooldownById(hero, specialId);
        return { healTarget: 2, powerSpent: cost, label: "Toque de la vida" };
      }
      case "VINCULO_NATURAL": {
        const cost = ensureAndSpendPower(hero, 4);
        putOnCooldownById(hero, specialId);
        return { healTarget: 2, powerSpent: cost, label: "Vínculo natural (+2 por 1T)" };
      }
      case "CANTO_BOSQUE": {
        const cost = ensureAndSpendPower(hero, 6);
        putOnCooldownById(hero, specialId);
        const amount = randInRange(2, 12); // ~2d6
        return { healGroup: amount, powerSpent: cost, label: "Canto del bosque" };
      }

      // === Médico ===
      case "CURACION_DIRECTA": {
        const cost = ensureAndSpendPower(hero, 2);
        putOnCooldownById(hero, specialId);
        return { healTarget: 2, powerSpent: cost, label: "Curación directa" };
      }
      case "NEUTRALIZACION_EFECTOS": {
        const cost = ensureAndSpendPower(hero, 4);
        putOnCooldownById(hero, specialId);
        const extra = randInRange(2, 8); // ~2d4
        return { healTarget: 2 + extra, powerSpent: cost, label: "Neutralización de efectos" };
      }
      case "REANIMACION": {
        const spent = hero.power ?? 0; // “todos los puntos de poder”
        ensureAndSpendPower(hero, spent);
        putOnCooldownById(hero, specialId);
        return { setToFull: true, powerSpent: spent, label: "Reanimación" };
      }
    }
  }
}