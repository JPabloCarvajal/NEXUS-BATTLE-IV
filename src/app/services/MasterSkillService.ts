// src/app/services/MasterSkillService.ts
import { Player } from "../../domain/entities/Player";

export type MasterId =
  | "MASTER.TANK_GOLPE_DEFENSA"
  | "MASTER.ARMS_SEGUNDO_IMPULSO"
  | "MASTER.FIRE_LUZ_CEGADORA"
  | "MASTER.ICE_FRIO_CONCENTRADO"
  | "MASTER.VENENO_TOMA_LLEVA"
  | "MASTER.MACHETE_INTIMIDACION_SANGRIENTA"
  | "MASTER.SHAMAN_TE_CHANGUA"
  | "MASTER.MEDIC_REANIMADOR_3000";

export interface MasterOutcome {
  // Efectos globales (para TODOS menos el caster; se decide en BattleService)
  globalAttackPlus?: number;   // +ATK
  globalDamagePlus?: number;   // +DMG plano (se suma a min/max)
  globalLifePlus?: number;     // +HP instantáneo
  globalHealAll?: number;      // heal instantáneo a todos

  // Efectos sobre oponentes
  opponentPowerMinus?: number; // -Power a rivales (min 0)

  // Efectos SOLO para el caster (épico por tipo)
  casterLifePlus?: number;         // +HP instantáneo
  casterDamagePlus?: number;       // +DMG plano (buff temporal)
  casterCritPlusPct?: number;      // +% crítico (ajusta tabla de efectos del caster)
  casterImmuneNextHit?: boolean;   // inmune al siguiente golpe recibido
  casterReflectHalfNextHit?: boolean; // refleja 50% del siguiente golpe recibido
  casterRezOnce20?: boolean;       // revive a un aliado 1 vez al 20% (simple)

  // Texto informativo (opcional)
  label: string;
}

/** Probabilidades estáticas (para misiones) */
export const MASTER_PROBABILITIES: Record<MasterId, number> = {
  "MASTER.TANK_GOLPE_DEFENSA": 0.0004,
  "MASTER.ARMS_SEGUNDO_IMPULSO": 0.0001,
  "MASTER.FIRE_LUZ_CEGADORA": 0.0003,
  "MASTER.ICE_FRIO_CONCENTRADO": 0.0005,
  "MASTER.VENENO_TOMA_LLEVA": 0.0002,
  "MASTER.MACHETE_INTIMIDACION_SANGRIENTA": 0.0001,
  "MASTER.SHAMAN_TE_CHANGUA": 0.001,
  "MASTER.MEDIC_REANIMADOR_3000": 0.001,
};

const randBetween = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

/** Cooldown de masters: hero.__masterCd[id] */
function getCd(hero: any, id: MasterId) {
  const cdMap = (hero.__masterCd ?? {}) as Record<string, number>;
  return cdMap[id] ?? 0;
}
function setCd(hero: any, id: MasterId, turns: number) {
  if (!hero.__masterCd) hero.__masterCd = {};
  hero.__masterCd[id] = turns;
}

export default class MasterSkillService {
  /**
   * Lanza el épico/máster del caster.
   * - No gasta poder.
   * - Deja CD = 2 turnos (se “tickea” en BattleService).
   */
  static resolveMaster(source: Player, id: MasterId): MasterOutcome {
    const h: any = source.heroStats?.hero;
    if (!h) throw new Error("Hero not found");
    if (getCd(h, id) > 0) throw new Error("Master skill is on cooldown");
    setCd(h, id, 2);

    switch (id) {
      // ===== GUERRERO =====
      case "MASTER.TANK_GOLPE_DEFENSA": {
        return {
          globalAttackPlus: 1,   // (+1 ATK a aliados EXCEPTO caster; se maneja en BattleService)
          casterDamagePlus: 4,   // épico del tanque
          casterCritPlusPct: 2,
          label: "Golpe de defensa",
        };
      }
      case "MASTER.ARMS_SEGUNDO_IMPULSO": {
        const healAll = randBetween(1, 4); // 1d4 simplificado a 1..4 (aliados)
        return {
          globalHealAll: healAll,
          casterLifePlus: 3,        // +3 vida al caster
          casterCritPlusPct: 5,     //  +5% crítico al caster
          label: "Segundo impulso",
        };
      }

      // ===== MAGO =====
      case "MASTER.FIRE_LUZ_CEGADORA": {
        return {
          globalLifePlus: 1,     // +1 vida a aliados (EXCEPTO caster)
          casterDamagePlus: 2,   // épico de Fuego
          casterCritPlusPct: 1,
          label: "Luz cegadora",
        };
      }
      case "MASTER.ICE_FRIO_CONCENTRADO": {
        return {
          opponentPowerMinus: 1,     // -1 power a rivales
          casterImmuneNextHit: true, // épico de Hielo
          label: "Frío concentrado",
        };
      }

      // ===== PÍCARO =====
      case "MASTER.VENENO_TOMA_LLEVA": {
        return {
          globalAttackPlus: 1,            // +1 ATK a aliados (EXCEPTO caster)
          casterReflectHalfNextHit: true, // épico de Veneno
          label: "Toma y lleva",
        };
      }
      case "MASTER.MACHETE_INTIMIDACION_SANGRIENTA": {
        return {
          globalDamagePlus: 1,  // +1 DMG a aliados (EXCEPTO caster)
          casterLifePlus: 2,    // épico de Machete
          casterCritPlusPct: 2,
          label: "Intimidación sangrienta",
        };
      }

      // ===== SANADORES =====
      case "MASTER.SHAMAN_TE_CHANGUA": {
        const healAll = randBetween(4, 8); // “4d8” simplificado a 4..8
        return {
          globalHealAll: healAll, // aliados; incluye caster (se maneja en BattleService)
          label: "Té changua",
        };
      }
      case "MASTER.MEDIC_REANIMADOR_3000": {
        return {
          casterRezOnce20: true, // revive 1 aliado al 20% (simple)
          label: "Reanimador 3000",
        };
      }
    }
  }
}
