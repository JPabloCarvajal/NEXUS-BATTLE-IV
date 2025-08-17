// application/services/BattleService.ts
import { randomInt } from "crypto";
import { Battle } from "../../domain/entities/Battle";
import { RandomEffectType } from "../../domain/entities/HeroStats";
import { Team } from "../../domain/entities/Team";
import { Action } from "../../domain/valueObjects/Action";
import { BattleRepository } from "../useCases/battle/BattleRepository";
import { RoomRepository } from "../useCases/rooms/RoomRepository";
import AleatoryAttackEffect from "./aleatoryEffectsGenerator/impl/aleatoryAttackEffect";
import { Player } from "../../domain/entities/Player";

export class BattleService {
  constructor(private roomRepository: RoomRepository, 
    private battleRepository: BattleRepository
  ) {}

  createBattleFromRoom(roomId: string): Battle {
    const room = this.roomRepository.findById(roomId);
    if (!room) throw new Error("Room not found");

    const teamA = new Team("A", room.TeamA);
    const teamB = new Team("B", room.TeamB);

    const turnOrder =  this.generateTurnOrder(teamA, teamB);

    const battle = new Battle(
      room.id,
      room.id,
      [teamA, teamB],
      turnOrder
    );

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


  handleAction(roomId: string, action: Action) {
    const battle = this.battleRepository.findById(roomId);
    if (!battle) throw new Error("Battle not found");

    // 1. Validar turno
    const currentPlayerId = battle.getCurrentActor();
    if (currentPlayerId !== action.sourcePlayerId) {
      throw new Error("Not your turn");
    }

    // 2. Validar acción
    const source = battle.findPlayer(action.sourcePlayerId);
    const target = battle.findPlayer(action.targetPlayerId);
    if (!source || !target) throw new Error("Invalid source or target");

    let damage = 0;
    let effect: string | null = null;

    switch (action.type) {
      case "BASIC_ATTACK":
        damage = this.calculateDamage(source, target);
        console.log("BASIC_ATTACK", { source, target, damage });
        break;

      // case "SPECIAL_SKILL":
      //   this.validateSkill(source, action.skillId!);
      //   break;

      // case "MASTER_SKILL":
      //   this.validateMasterSkill(source, action.skillId!);
      //   damage = this.calculateDamage(source.stats.attack * 2, target.stats.defense);
      //   effect = this.rollRandomEffect(true); // efectos más fuertes
      //   break;
    }

    // 3. Aplicar resultado
    target.heroStats.hero.health = Math.max(0, target.heroStats?.hero.health - damage);
    // if (effect) target.applyEffect(effect);

    // 4. Verificar KO
    const ko = target.heroStats.hero.health <= 0;

    // 5. Avanzar turno
    battle.advanceTurn();

    battle.battleLogger.addLog(
      {
        timestamp: Date.now(),
        attacker: source.username,
        target: target.username,
        value: damage,
        effect: effect,
      }
    )

    this.battleRepository.save(battle);
    
    // 6. Retornar resultado para emitirlo por WS
    return {
      action,
      damage,
      effect,
      ko,
      source: {
        ...source.heroStats.hero,
      },
      target: {
        ...target.heroStats.hero,
      },
      nextTurnPlayer: battle.getCurrentActor(),
    };
  }

  private calculateDamage(source: Player, target: Player): number {
    const attack = source.heroStats?.hero.attack || 0;
    const attackBoost = source.heroStats?.hero.attackBoost || { min: 0, max: 0 };
    const defense = target.heroStats?.hero.defense || 0;
    const boostedAttack = attack + randomInt(attackBoost.min, attackBoost.max + 1);

    if (boostedAttack > defense){
      return this.randomValueAplication(source);
    }else{
      return 0;
    }
  }

  private randomValueAplication(source: Player): number{
    const probabilites = source.heroStats?.hero.randomEffects.map(effect => effect.percentage) || [];
    const results = source.heroStats?.hero.randomEffects.map(effect => effect.randomEffectType) || [];
    const aleatoryAttackEffect = new AleatoryAttackEffect(probabilites, results);

    const result = aleatoryAttackEffect.generateAleatoryEffect();
    const damage = randomInt(
      source.heroStats?.hero.damage?.min ?? 0,
      (source.heroStats?.hero.damage?.max ?? 0) + 1
    );

    switch (result) {
      case RandomEffectType.DAMAGE:
        return damage;
        break;
      case RandomEffectType.CRITIC_DAMAGE:
        return Math.floor(damage * (1.2 + Math.random() * 0.6));
        break;
      case RandomEffectType.EVADE:
        return damage * 0.8;
        break;
      case RandomEffectType.RESIST:
        return damage * 0.6;
        break;
      case RandomEffectType.ESCAPE:
        return damage * 0.4;
        break;
      case RandomEffectType.NEGATE:
        return 0;
        break;
      default:
        return damage;
        break;
    }
  }

  // private validateSkill(source: Player, skillId: string) {
  //   const skill = source.heroStats?.hero.specialActions.find(s => s.name === skillId);
  //   if (!skill) throw new Error("Skill not found");
  //   if (!skill.isAvailable) throw new Error("Skill is on cooldown");
  //   if (skill.powerCost > (source.heroStats?.hero.power ?? 0)) {
  //     throw new Error("Not enough power to use this skill");
  //   }
  // }
}
