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

type TempBuff = { atk?: number; def?: number; dmgFlat?: number };

// Yo se que esto esta chambon aqui puesto pero dios estoy mamado, luego lo cambio (Nolovoyahacer)
// Specials que SON de curación (no pegan básico)
const HEAL_SPECIALS: ReadonlySet<SpecialId> = new Set<SpecialId>([
  "TOQUE_VIDA",
  "VINCULO_NATURAL",
  "CANTO_BOSQUE",
  "CURACION_DIRECTA",
  "NEUTRALIZACION_EFECTOS",
  "REANIMACION",
]);

export class BattleService {
  constructor(
    private roomRepository: RoomRepository,
    private battleRepository: BattleRepository
  ) {}

  createBattleFromRoom(roomId: string): Battle {
    const room = this.roomRepository.findById(roomId);
    if (!room) throw new Error("Room not found");

    const teamA = new Team("A", room.TeamA);
    const teamB = new Team("B", room.TeamB);
    const turnOrder = this.generateTurnOrder(teamA, teamB);

    const battle = new Battle(room.id, room.id, [teamA, teamB], turnOrder);
    battle.startBattle();
    this.battleRepository.save(battle);
    return battle;
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

  // ====== BUFFS TEMPORALES ======
  private applyTempBuff(p: Player, buff: TempBuff) {
    const h: any = p.heroStats?.hero;
    if (!h) return;

    // evita acumulaciones locas
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

    // marcar para quitarse ANTES de su próximo turno real
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

  /** Quita el buff si estaba marcado para salir antes de que este jugador actúe :v */
  private removeBuffIfPendingAtTurnStart(p: Player) {
    const h: any = p.heroStats?.hero;
    if (h?.__buffPendingRemoval) {
      this.removeTempBuff(p);
    }
  }

  handleAction(roomId: string, action: Action) {
    const battle = this.battleRepository.findById(roomId);
    if (!battle) throw new Error("Battle not found");

    // 1) Validar turno
    const currentPlayerId = battle.getCurrentActor();
    if (currentPlayerId !== action.sourcePlayerId) {
      throw new Error("Not your turn");
    }

    // 2) Source/Target
    const source = battle.findPlayer(action.sourcePlayerId);
    const target = battle.findPlayer(action.targetPlayerId);
    if (!source || !target) throw new Error("Invalid source or target");

    // 2.1) Inicio del turno del actor → quitar su buff si estaba pendiente
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

        const isHeal = HEAL_SPECIALS.has(specialId);
        if (outcome.setToFull) {
          target.heroStats.hero.health = 100; // o tu healthMax real
        } else if (outcome.healTarget) {
          target.heroStats.hero.health = target.heroStats.hero.health + outcome.healTarget;
        }

        // aplicar buffs temporales
        const atk = outcome.tempAttack ?? 0;
        const def = outcome.tempDefense ?? 0;
        const dmgFlat = outcome.flatDamageBonus ?? 0;
        if (atk || def || dmgFlat) this.applyTempBuff(source, { atk, def, dmgFlat });

        // pegar básico automático (no va a pegar el basico si la accion especial es de tipo HEAL)
        if (!isHeal) {
          damage = this.calculateDamage(source, target);
        }

        // heal grupal opcional
        if (outcome.healGroup) {
          const team = battle.teams.find(t => !!t.findPlayer(source.username));
          if (team) {
            team.players.forEach(p => {
              p.heroStats.hero.health = p.heroStats.hero.health + outcome.healGroup!;
            });
          }
        }

        effect = "SPECIAL_SKILL";
        break;
      }
    }

    // 3) Aplicar daño
    target.heroStats.hero.health = Math.max(0, target.heroStats?.hero.health - damage);

    // 4) KO?
    const ko = target.heroStats.hero.health <= 0;

    // 5) Avanzar turno
    battle.advanceTurn();

    // *** CLAVE: quitar el buff del jugador que VA A ENTRAR ahora mismo ***
    const incomingId = battle.getCurrentActor();               // quien juega AHORA
    const incoming   = battle.findPlayer(incomingId);
    if (incoming) this.removeBuffIfPendingAtTurnStart(incoming);

    // 6) Log
    battle.battleLogger.addLog({
      timestamp: Date.now(),
      attacker: source.username,
      target: target.username,
      value: damage,
      effect: effect,
    });

    this.battleRepository.save(battle);

    // 7) Respuesta
    return {
      action,
      damage,
      effect,
      ko,
      source: { ...source.heroStats.hero },
      target: { ...target.heroStats.hero },
      nextTurnPlayer: battle.getCurrentActor(),
      battle,
    };
  }

  private calculateDamage(source: Player, target: Player): number {
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
    const results = source.heroStats?.hero.randomEffects.map(e => e.randomEffectType) || [];
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