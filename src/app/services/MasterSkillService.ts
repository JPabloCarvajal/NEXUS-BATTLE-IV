import { Player } from "../../domain/entities/Player";
import { HeroType } from "../../domain/entities/HeroStats";

export type MasterId =
  | "GOLPE_DEFENSA"     // Guerrero Tanque
  | "SEGUNDO_IMPULSO"    // Guerrero Armas
  | "LUZ_CEGADORA"       // Mago Fuego
  | "FRIO_CONCENTRADO"   // Mago Hielo
  | "TOMA_LLEVA"         // Pícaro Veneno
  | "INTIMIDACION"       // Pícaro Machete
  | "TE_CHANGUA"         // Chamán
  | "REANIMADOR_3000";   // Médico

export interface MasterOutcome {
  // Efectos temporales (duran hasta el siguiente turno)
  tempAttack?: number;  // (+ATK)
  tempDefense?: number; // (+DEF)
  flatDamageBonus?: number;  // (+DMG)
  healGroup?: number;    // Cura a todos los héroes
  healTarget?: number;   // Cura solo al objetivo
  setToFull?: boolean;   // Restaura al 100% de salud

  // Datos adicionales
  powerSpent?: number;  // No se usa para estas, pero lo dejamos por consistencia
  label: string;        // Nombre del efecto
}

function randInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default class MasterSkillService {
  public static resolveMaster(source: Player, masterId: MasterId): MasterOutcome {
    const hero = source.heroStats.hero;

    switch (masterId) {
      // Guerrero (Tanque): Golpe de defensa (+1 al ataque para todos los héroes)
      case "GOLPE_DEFENSA": {
        return { tempAttack: 1, label: "Golpe de defensa (+1 ATQ para todos)" };
      }

      // Guerrero (Armas): Segundo impulso (Recupera 1d4 de vida, +3 vida al Guerrero Armas)
      case "SEGUNDO_IMPULSO": {
        const heal = randInRange(1, 4);
        if (hero.heroType === HeroType.GUERRERO_ARMAS) {
          return { healTarget: heal + 3, label: `Segundo impulso (+${heal + 3} HP)` };
        }
        return { healTarget: heal, label: `Segundo impulso (+${heal} HP)` };
      }

      // Mago (Fuego): Luz cegadora (+1 a la vida para todos los héroes)
      case "LUZ_CEGADORA": {
        return { healGroup: 1, label: "Luz cegadora (+1 HP para todos)" };
      }

      // Mago (Hielo): Frío concentrado (-1 de poder al oponente)
      case "FRIO_CONCENTRADO": {
        return { tempAttack: -1, label: "Frío concentrado (-1 POW al oponente)" };
      }

      // Pícaro (Veneno): Toma y lleva (+1 al ataque para todos los héroes)
      case "TOMA_LLEVA": {
        return { tempAttack: 1, label: "Toma y lleva (+1 ATQ para todos)" };
      }

      // Pícaro (Machete): Intimidación sangrienta (+1 al daño para todos los héroes)
      case "INTIMIDACION": {
        return { flatDamageBonus: 1, label: "Intimidación sangrienta (+1 DMG para todos)" };
      }

      // Chamán: Té changua (No aplica efecto para todos los héroes)
      case "TE_CHANGUA": {
        return { label: "Té changua (sin efecto)" };
      }

      // Médico: Reanimador 3000 (No aplica efecto para todos los héroes)
      case "REANIMADOR_3000": {
        return { label: "Reanimador 3000 (sin efecto)" };
      }

      default:
        throw new Error("Unknown Master Skill");
    }
  }
}
