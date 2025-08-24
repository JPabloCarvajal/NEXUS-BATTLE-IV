// src/app/services/BattleService.ts
import { randomInt } from "crypto";
import { Battle } from "../../domain/entities/Battle";
import { RandomEffectType } from "../../domain/entities/HeroStats";
import { Team } from "../../domain/entities/Team";
import { Action } from "../../domain/valueObjects/Action";
import { BattleRepository } from "../useCases/battle/BattleRepository";
import { RoomRepository } from "../useCases/rooms/RoomRepository";
import AleatoryAttackEffect from "./aleatoryEffectsGenerator/impl/aleatoryAttackEffect";
import { Player } from "../../domain/entities/Player";
import SpecialSkillService, { SpecialId } from "./SpecialSkillService";
import MasterSkillService, { MasterId, MasterOutcome } from "./MasterSkillService";

type TempBuff = { atk?: number; def?: number; dmgFlat?: number };

export class BattleService {
  constructor(
    private roomRepository: RoomRepository,
    private battleRepository: BattleRepository
  ) {}

  // ======================= Battle bootstrap =======================
  async createBattleFromRoom(roomId: string): Promise<Battle> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new Error("Room not found");

    const teamA = new Team("A", room.TeamA);
    const teamB = new Team("B", room.TeamB);

    const turnOrder = this.generateTurnOrder(teamA, teamB);
    const battle = new Battle(room.id, room.id, [teamA, teamB], turnOrder);

    battle.startBattle();
    this.battleRepository.save(battle);
    return battle;
  }

  async getBattle(roomId: string): Promise<Battle | undefined> {
    return await this.battleRepository.findById(roomId);
  }

  private recoverPowerBeforeTurn(player: Player, battle: Battle) {
    const hero = player.heroStats?.hero;
    if (!hero) return;

    const currentPower = hero.power ?? 0;
    const maxPower = battle.initialPowers.get(player.username) ?? 0;
    const powerToRecover = Math.min(2, maxPower - currentPower);

    if (powerToRecover > 0) {
      hero.power = currentPower + powerToRecover;
    }
  }

    /**
   * Verifica si algún equipo ha ganado la batalla
   * @param battle La batalla actual
   * @returns { winner: string | null, battleEnded: boolean }
   */
  private checkBattleEnd(battle: Battle): { winner: string | null, battleEnded: boolean } {
    const teamA = battle.teams.find(t => t.id === "A");
    const teamB = battle.teams.find(t => t.id === "B");

    if (!teamA || !teamB) {
      return { winner: null, battleEnded: false };
    }

    // Verificar si todos los miembros del equipo A están muertos
    const teamAAllDead = teamA.players.every(player => 
      (player.heroStats?.hero.health ?? 0) <= 0
    );

    // Verificar si todos los miembros del equipo B están muertos
    const teamBAllDead = teamB.players.every(player => 
      (player.heroStats?.hero.health ?? 0) <= 0
    );

    // Si ambos equipos están muertos (empate), devolver empate
    if (teamAAllDead && teamBAllDead) {
      battle.endBattle("DRAW");
      return { winner: "DRAW", battleEnded: true };
    }

    // Si equipo A está muerto, gana equipo B
    if (teamAAllDead) {
      battle.endBattle("B");
      return { winner: "B", battleEnded: true };
    }

    // Si equipo B está muerto, gana equipo A
    if (teamBAllDead) {
      battle.endBattle("A");
      return { winner: "A", battleEnded: true };
    }

    // La batalla continúa
    return { winner: null, battleEnded: false };
  }

  generateTurnOrder(teamA: Team, teamB: Team): string[] {
    const firstTeam = Math.random() < 0.5 ? teamA : teamB;
    const secondTeam = firstTeam === teamA ? teamB : teamA;

    const order: string[] = [];
    const maxLen = Math.max(teamA.players.length, teamB.players.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < firstTeam.players.length) order.push(firstTeam.players[i]?.username || "");
      if (i < secondTeam.players.length) order.push(secondTeam.players[i]?.username || "");
    }
    return order;
  }

  async endBattleByDisconnection(roomId: string, winner: string) {
    const battle = await this.battleRepository.findById(roomId);
    if (!battle) throw new Error("Battle not found");
    
    battle.endBattle(winner);
    await this.battleRepository.save(battle);
  }

  // ======================= Helpers de batalla =======================
  private allPlayers(b: Battle): Player[] {
    return b.teams.flatMap(t => t.players);
  }

  private opponentsOf(b: Battle, of: Player): Player[] {
    const myTeam = b.teams.find(t => t.findPlayer(of.username));
    const opp    = b.teams.find(t => t !== myTeam);
    return opp ? opp.players : [];
  }
  private alliesOf(b: Battle, of: Player): Player[] {
    const myTeam = b.teams.find(t => t.findPlayer(of.username));
    return myTeam ? myTeam.players : [];
  }

  // Ajusta % de crítico del héroe (+/- delta) moviendo prob desde NEGATE y luego DAMAGE
  private adjustCritChance(hero: any, deltaPct: number) {
    if (!deltaPct) return;
    const effects = hero.randomEffects ?? [];
    const idxCrit = effects.findIndex((e: any) => e.randomEffectType === "CRITIC_DAMAGE");
    if (idxCrit < 0) return;
    effects[idxCrit].percentage = Math.max(0, (effects[idxCrit].percentage ?? 0) + deltaPct);

    let rest = deltaPct > 0 ? deltaPct : 0;
    if (rest > 0) {
      const idxNeg = effects.findIndex((e: any) => e.randomEffectType === "NEGATE");
      if (idxNeg >= 0) {
        const take = Math.min(rest, effects[idxNeg].percentage ?? 0);
        effects[idxNeg].percentage = Math.max(0, (effects[idxNeg].percentage ?? 0) - take);
        rest -= take;
      }
    }
    if (rest > 0) {
      const idxDmg = effects.findIndex((e: any) => e.randomEffectType === "DAMAGE");
      if (idxDmg >= 0) {
        effects[idxDmg].percentage = Math.max(0, (effects[idxDmg].percentage ?? 0) - rest);
      }
    }
  }

  // Inmunidad al próximo golpe recibido
  private isTargetImmuneNow(target: Player): boolean {
    const th: any = target.heroStats?.hero;
    if (th?.__immuneNextIncomingHit) {
      th.__immuneNextIncomingHit = false;
      return true;
    }
    return false;
  }

  // Aplica daño con reflejo 50/50 (si el target tiene el flag activo)
  private applyDamageWithReflection(source: Player, target: Player, damage: number): number {
    if (damage <= 0) return 0;
    const th: any = target.heroStats?.hero;
    if (th?.__reflectHalfNextHit) {
      const half = Math.floor(damage / 2);
      th.__reflectHalfNextHit = false;
      // target recibe mitad
      target.heroStats.hero.health = Math.max(0, target.heroStats.hero.health - half);
      // source recibe mitad
      const sh: any = source.heroStats?.hero;
      sh.health = Math.max(0, (sh.health ?? 0) - half);
      return half; // daño efectivo sobre target
    } else {
      target.heroStats.hero.health = Math.max(0, target.heroStats?.hero.health - damage);
      return damage;
    }
  }

  // Tick global de cooldowns de master skills
  private tickMastersCooldown(battle: Battle) {
    for (const p of this.allPlayers(battle)) {
      const h: any = p.heroStats?.hero;
      if (!h?.__masterCd) continue;
      for (const k of Object.keys(h.__masterCd)) {
        if (h.__masterCd[k] > 0) h.__masterCd[k] -= 1;
      }
    }
  }

  // ======================= Buffs temporales =======================
  private applyTempBuff(p: Player, buff: TempBuff) {
    const h: any = p.heroStats?.hero;
    if (!h) return;

    if (h.__tempBuff) this.removeTempBuff(p);

    h.__tempBuff = {
      atk: buff.atk ?? 0,
      def: buff.def ?? 0,
      dmgFlat: buff.dmgFlat ?? 0,
    };

    if (h.__tempBuff.atk)    h.attack  = (h.attack  ?? 0) + h.__tempBuff.atk;
    if (h.__tempBuff.def)    h.defense = (h.defense ?? 0) + h.__tempBuff.def;
    if (h.__tempBuff.dmgFlat) {
      const min = (h.damage?.min ?? 0) + h.__tempBuff.dmgFlat;
      const max = (h.damage?.max ?? 0) + h.__tempBuff.dmgFlat;
      h.damage = { min, max };
    }

    // se retirará antes de que le vuelva a tocar al dueño (ver más abajo)
    h.__buffPendingRemoval = true;
  }

  private removeTempBuff(p: Player) {
    const h: any = p.heroStats?.hero;
    if (!h?.__tempBuff) return;
    const b: TempBuff = h.__tempBuff;

    if (b.atk)    h.attack  = (h.attack  ?? 0) - b.atk;
    if (b.def)    h.defense = (h.defense ?? 0) - b.def;
    if (b.dmgFlat) {
      const min = (h.damage?.min ?? 0) - b.dmgFlat;
      const max = (h.damage?.max ?? 0) - b.dmgFlat;
      h.damage = { min, max };
    }

    delete h.__tempBuff;
    h.__buffPendingRemoval = false;
  }

  /** Quita el buff si estaba marcado, justo antes de que este jugador actúe */
  private removeBuffIfPendingAtTurnStart(p: Player) {
    const h: any = p.heroStats?.hero;
    if (h?.__buffPendingRemoval) {
      this.removeTempBuff(p);
    }
  }

  async cleanupRoomBattle(roomId: string) {
    await this.battleRepository.delete(roomId);
    await this.roomRepository.delete(roomId);
  }

  // ======================= Main =======================
  async handleAction(roomId: string, action: Action, skip?: boolean) {
    const battle = await this.battleRepository.findById(roomId);
    if (!battle) throw new Error("Battle not found");

    if (skip){
      battle.advanceTurn();
      this.battleRepository.save(battle);
      return {
        action,
        damage: 0,
        effect: "Lost turn",
        ko: false,
        nextTurnPlayer: battle.getCurrentActor(),
        battle,
      };
    }

    // 1) Validar turno
    const currentPlayerId = battle.getCurrentActor();
    if (currentPlayerId !== action.sourcePlayerId) {
      throw new Error("Not your turn");
    }

    // 2) Source/Target
    const source = battle.findPlayer(action.sourcePlayerId);
    const target = battle.findPlayer(action.targetPlayerId);
    if (!source || !target) throw new Error("Invalid source or target");

    // 2.1) Inicio del turno del actor → quitar su buff si quedaba del turno previo
    this.removeBuffIfPendingAtTurnStart(source);

    let damage = 0;
    let effect: string | null = null;

    switch (action.type) {
      case "BASIC_ATTACK": {
        damage = this.calculateDamage(source, target);
        break;
      }

      case "SPECIAL_SKILL": {
        if (!action.skillId) throw new Error("skillId requerido para SPECIAL_SKILL");

        const specialId = action.skillId as SpecialId;
        const outcome = SpecialSkillService.resolveSpecial(source, specialId);

        // Buffs temporales al actor
        const atk = outcome.tempAttack ?? 0;
        const def = outcome.tempDefense ?? 0;
        const dmgFlat = outcome.flatDamageBonus ?? 0;
        if (atk || def || dmgFlat) this.applyTempBuff(source, { atk, def, dmgFlat });

        // SIEMPRE pega básico automático
        damage = this.calculateDamage(source, target);

        effect = "SPECIAL_SKILL";
        break;
      }

      case "MASTER_SKILL": {
        if (!action.skillId) throw new Error("skillId requerido para MASTER_SKILL");
        const masterId = action.skillId as MasterId;

        // 1) Resolver máster (setea CD=2)
        const outcome: MasterOutcome = MasterSkillService.resolveMaster(source, masterId);

        // Listas útiles
        const allies             = this.alliesOf(battle, source);
        const alliesExceptCaster = allies.filter(p => p.username !== source.username);
        const opponents          = this.opponentsOf(battle, source);

        // 2) Globales: SOLO aliados; por defecto EXCEPTO caster
        //    *Excepción*: SHAMAN_TE_CHANGUA cura aliados INCLUYENDO caster
        if (outcome.globalAttackPlus) {
          for (const p of alliesExceptCaster) this.applyTempBuff(p, { atk: outcome.globalAttackPlus });
        }
        if (outcome.globalDamagePlus) {
          for (const p of alliesExceptCaster) this.applyTempBuff(p, { dmgFlat: outcome.globalDamagePlus });
        }
        if (outcome.globalLifePlus) {
          for (const p of alliesExceptCaster) {
            const h: any = p.heroStats?.hero;
            h.health = (h.health ?? 0) + outcome.globalLifePlus;
          }
        }
        if (outcome.globalHealAll) {
          const healTargets = (masterId === "MASTER.SHAMAN_TE_CHANGUA")
            ? allies                // incluye caster
            : alliesExceptCaster;   
          for (const p of healTargets) {
            const h: any = p.heroStats?.hero;
            h.health = (h.health ?? 0) + outcome.globalHealAll;
          }
        }

        if (outcome.opponentPowerMinus) {
          for (const p of opponents) {
            const h: any = p.heroStats?.hero;
            h.power = Math.max(0, (h.power ?? 0) - outcome.opponentPowerMinus);
          }
        }

        // 3) Solo caster (épico por tipo)
        const sh: any = source.heroStats?.hero;
        if (outcome.casterLifePlus)           sh.health = (sh.health ?? 0) + outcome.casterLifePlus;
        if (outcome.casterDamagePlus)         this.applyTempBuff(source, { dmgFlat: outcome.casterDamagePlus });
        if (outcome.casterCritPlusPct)        this.adjustCritChance(sh, outcome.casterCritPlusPct);
        if (outcome.casterImmuneNextHit)      sh.__immuneNextIncomingHit = true;
        if (outcome.casterReflectHalfNextHit) sh.__reflectHalfNextHit = true;
        if (outcome.casterRezOnce20)          sh.__rezOnceAt20 = true;

        // Las masters NO pegan básico automático
        effect = "MASTER_SKILL";
        damage = 0;
        break;
      }
    }

    // 3) Aplicar daño (con reflejo 50/50 si corresponde)
    const dealt = this.applyDamageWithReflection(source, target, damage);

    // 4) KO / revive simple 20%
    let ko = target.heroStats.hero.health <= 0;
    if (ko) {
      const myTeam = battle.teams.find(t => t.findPlayer(target.username));
      if (myTeam) {
        const medic = myTeam.players.find(p => (p.heroStats as any)?.hero?.__rezOnceAt20);
        if (medic) {
          const th: any = target.heroStats?.hero;
          th.health = Math.max(1, Math.ceil(100 * 0.2)); // 20% de 100 (simple)
          (medic.heroStats as any).hero.__rezOnceAt20 = false;
          ko = false;
        }
      }
    }

    // 4.1) Verificar si la batalla ha terminado
    const battleResult = this.checkBattleEnd(battle);

    // Si la batalla terminó, no avanzar turno ni hacer más procesamiento
    if (battleResult.battleEnded) {
      // 6) Log final
      battle.battleLogger.addLog({
        timestamp: Date.now(),
        attacker: source.username,
        target: target.username,
        value: dealt,
        effect: effect,
      });

      this.battleRepository.save(battle);

      // 7) Respuesta con resultado de batalla
      return {
        action,
        damage: dealt,
        effect,
        ko,
        source: { ...source.heroStats.hero },
        target: { ...target.heroStats.hero },
        nextTurnPlayer: null, // No hay próximo turno
        battle,
        battleEnded: true,
        winner: battleResult.winner,
      };
    }

    // 5) Avanzar turno
    battle.advanceTurn();

    // Limpia buff del que ENTRA (para que no inicie su turno buffeado)
    const incomingId = battle.getCurrentActor();
    const incoming   = battle.findPlayer(incomingId);
    if (incoming) {
      this.removeBuffIfPendingAtTurnStart(incoming);
      this.recoverPowerBeforeTurn(incoming, battle);
    }

    // Tick de cooldown de masters
    this.tickMastersCooldown(battle);

    // 6) Log
    battle.battleLogger.addLog({
      timestamp: Date.now(),
      attacker: source.username,
      target: target.username,
      value: dealt,
      effect: effect,
    });

    this.battleRepository.save(battle);

    // 7) Respuesta
    return {
      action,
      damage: dealt,
      effect,
      ko,
      source: { ...source.heroStats.hero },
      target: { ...target.heroStats.hero },
      nextTurnPlayer: battle.getCurrentActor(),
      battle,
    };
  }

  private calculateDamage(source: Player, target: Player): number {
    // Inmunidad por épica (próximo golpe recibido)
    if (this.isTargetImmuneNow(target)) return 0;

    const attack = source.heroStats?.hero.attack || 0;
    const attackBoost = source.heroStats?.hero.attackBoost || { min: 0, max: 0 };
    const defense = target.heroStats?.hero.defense || 0;
    const boostedAttack = attack + randomInt(attackBoost.min, (attackBoost.max ?? 0) + 1);

    if (boostedAttack > defense) {
      return this.randomValueAplication(source);
    } else {
      return 0;
    }
  }

  private randomValueAplication(source: Player): number {
    const probabilites = source.heroStats?.hero.randomEffects.map(e => e.percentage) || [];
    const results      = source.heroStats?.hero.randomEffects.map(e => e.randomEffectType) || [];
    const aleatoryAttackEffect = new AleatoryAttackEffect(probabilites, results);

    const result = aleatoryAttackEffect.generateAleatoryEffect();
    const damage = randomInt(
      source.heroStats?.hero.damage?.min ?? 0,
      (source.heroStats?.hero.damage?.max ?? 0) + 1
    );

    switch (result) {
      case RandomEffectType.DAMAGE:        return damage;
      case RandomEffectType.CRITIC_DAMAGE: return Math.floor(damage * (1.2 + Math.random() * 0.6));
      case RandomEffectType.EVADE:         return Math.floor(damage * 0.8);
      case RandomEffectType.RESIST:        return Math.floor(damage * 0.6);
      case RandomEffectType.ESCAPE:        return Math.floor(damage * 0.4);
      case RandomEffectType.NEGATE:        return 0;
      default:                             return damage;
    }
  }
}
