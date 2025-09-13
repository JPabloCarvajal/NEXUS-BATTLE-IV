// infrastructure/websockets/BattleSocket.ts
import { Server, Socket } from "socket.io";
import { BattleService } from "../../app/services/BattleService";
import { Battle } from "../../domain/entities/Battle";
import { Player } from "../../domain/entities/Player";
import { Team } from "../../domain/entities/Team";
import { RewardService } from "../../app/services/RewardService";

export class BattleSocket {
  private playerBattleMap = new Map<string, string>();
  private roomPlayerMap = new Map<string, Set<string>>();
  private playerSocketMap = new Map<string, string>();

  private turnTimers = new Map<string, NodeJS.Timeout>();
  private battleTimers = new Map<string, NodeJS.Timeout>();
  private battleStartTime = new Map<string, number>();

  constructor(
    private io: Server,
    private battleService: BattleService,
    private rewardService: RewardService
  ) {}

  attachHandlers(socket: Socket) {
    socket.on("joinBattle", ({ roomId, playerId }) => {
      console.log(`Player ${playerId} joined battle in room ${roomId}`);
      this.playerBattleMap.set(socket.id, roomId);
      this.playerSocketMap.set(socket.id, playerId);
      if (!this.roomPlayerMap.has(roomId)) {
        this.roomPlayerMap.set(roomId, new Set());
      }
      this.roomPlayerMap.get(roomId)!.add(socket.id);
      if (!this.battleStartTime.has(roomId)) {
        this.startBattleTimer(roomId);
        this.startTurnTimer(roomId);
      }
    });

    socket.on("submitAction", async ({ roomId, action }) => {
      try {
        console.log(`Action received in room ${roomId}:`, action);
        const result = await this.battleService.handleAction(roomId, action);
        if (result.battleEnded) {
          //  FIN POR ACCIÓN: enviar recompensas antes de emitir evento y limpiar
          try {
            await this.rewardService.awardBattleEnd(
              roomId,
              this.getActiveUsernames(roomId)
            );
          } catch (e) {
            console.error(
              "Failed to award credits on battle end:",
              (e as Error)?.message || e
            );
          }

          this.io.to(roomId).emit("battleEnded", { winner: result.winner });
          this.cleanupRoom(roomId);
        } else {
          this.startTurnTimer(roomId);
        }

        this.io.to(roomId).emit("actionResolved", result);
      } catch (err: unknown) {
        if (err instanceof Error) {
          socket.emit("error", { error: err.message });
        } else {
          socket.emit("error", { error: String(err) });
        }
      }
    });

    socket.on("leaveBattle", ({ roomId, playerId }) => {
      this.io.to(roomId).emit("playerLeftBattle", { playerId });
      socket.leave(roomId);
    });

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);
      this.handlePlayerDisconnect(socket);
    });
  }

  private async handlePlayerDisconnect(socket: Socket) {
    console.log("🔌 DISCONNECT EVENT TRIGGERED");
    console.log("Socket ID:", socket.id);

    const roomId = this.playerBattleMap.get(socket.id);
    const playerId = this.playerSocketMap.get(socket.id);

    console.log("📍 Mapped data:");
    console.log("  - roomId from map:", roomId);
    console.log("  - playerId from map:", playerId);
    console.log("  - playerBattleMap size:", this.playerBattleMap.size);
    console.log("  - playerSocketMap size:", this.playerSocketMap.size);

    if (!roomId) {
      console.log("❌ No roomId found for socket, cleaning up...");
      this.cleanupPlayerFromRoom(socket.id, "");
      return;
    }

    if (!playerId) {
      console.log("❌ No playerId found for socket, cleaning up...");
      this.cleanupPlayerFromRoom(socket.id, roomId);
      return;
    }

    try {
      console.log("🎯 Getting battle for roomId:", roomId);
      const battle = await this.battleService.getBattle(roomId);

      console.log("⚔️ Battle status:");
      console.log("  - battle exists:", !!battle);
      console.log("  - battle isEnded:", battle?.isEnded);
      console.log("  - battle status:", battle?.state);

      if (!battle) {
        console.log("❌ Battle not found, cleaning up...");
        this.cleanupPlayerFromRoom(socket.id, roomId);
        return;
      }

      if (battle.isEnded) {
        console.log("❌ Battle already ended, cleaning up...");
        this.cleanupPlayerFromRoom(socket.id, roomId);
        return;
      }

      // Encontrar qué equipo pertenece el jugador desconectado
      console.log("🔍 Looking for disconnected player:", playerId);
      const allPlayers = this.getAllPlayers(battle as Battle);
      console.log(
        "📋 All players in battle:",
        allPlayers.map((p: Player) => p.username)
      );

      const disconnectedPlayer = allPlayers.find(
        (p: Player) => p.username === playerId
      );
      console.log("👤 Disconnected player found:", !!disconnectedPlayer);

      if (!disconnectedPlayer) {
        console.log("❌ Disconnected player not found in battle");
        this.cleanupPlayerFromRoom(socket.id, roomId);
        return;
      }

      console.log("🏆 Determining winner team...");
      const winnerTeam = this.getOpponentTeam(
        battle as Battle,
        disconnectedPlayer
      );
      console.log("🎉 Winner team:", winnerTeam);

      // Terminar batalla y otorgar victoria
      console.log("🔚 Ending battle by disconnection...");
      this.battleService.endBattleByDisconnection(roomId, winnerTeam);

      //  FIN POR DESCONEXIÓN: enviar recompensas antes de emitir evento y limpiar
      try {
        await this.rewardService.awardBattleEnd(
          roomId,
          this.getActiveUsernames(roomId) // excluye al desconectado
        );
      } catch (e) {
        console.error(
          "Failed to award credits on DC end:",
          (e as Error)?.message || e
        );
      }

      // Notificar a todos los jugadores restantes
      console.log("📢 Emitting battleEnded event to room:", roomId);
      this.io.to(roomId).emit("battleEnded", {
        winner: winnerTeam,
        reason: `Player ${playerId} disconnected`,
        type: "DISCONNECTION",
      });

      console.log("📢 Emitting playerDisconnected event to room:", roomId);
      this.io.to(roomId).emit("playerDisconnected", {
        playerId: playerId,
      });

      console.log("🧹 Cleaning up room...");
      this.cleanupRoom(roomId);

      console.log("✅ Disconnect handling completed successfully");
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("💥 ERROR handling disconnect:", err.message);
        console.error("Stack trace:", err.stack);
      } else {
        console.error("💥 ERROR handling disconnect:", String(err));
      }
    }
  }

  /**
   * Inicia el timer de 8 minutos para toda la batalla
   */
  private startBattleTimer(roomId: string) {
    console.log("⏰ Starting 6-minute battle timer for room:", roomId);
    this.battleStartTime.set(roomId, Date.now());

    const timer = setTimeout(() => {
      this.handleBattleTimeout(roomId);
    }, 8 * 60 * 1000); // 8 minutos

    this.battleTimers.set(roomId, timer);
  }

  private startTurnTimer(roomId: string) {
    console.log("⏱️ Starting 30-second turn timer for room:", roomId);
    this.clearTurnTimer(roomId);
    const timer = setTimeout(() => {
      this.handleTurnTimeout(roomId);
    }, 60 * 1000); // 60 segundos

    this.turnTimers.set(roomId, timer);

    // Emitir evento para que el cliente muestre countdown
    this.io.to(roomId).emit("turnTimerStarted", { duration: 30 });
  }

  /**
   * Obtiene todos los jugadores de una batalla
   */
  private getAllPlayers(battle: Battle): Player[] {
    console.log("🎮 Getting all players from battle");
    console.log("Battle teams:", battle.teams?.length || 0);

    if (!battle.teams) {
      console.log("❌ No teams found in battle");
      return [];
    }

    const players = battle.teams.flatMap((t: Team) => {
      console.log(`Team ${t.id}: ${t.players?.length || 0} players`);
      return t.players || [];
    });

    console.log("📋 Total players found:", players.length);
    return players;
  }

  private getOpponentTeam(battle: Battle, player: Player): string {
    console.log("🔍 Finding opponent team for player:", player.username);

    const playerTeam = battle.teams.find((t: Team) => {
      const hasPlayer = t.players.some(
        (p: Player) => p.username === player.username
      );
      console.log(`Team ${t.id} has player:`, hasPlayer);
      return hasPlayer;
    });

    if (!playerTeam) {
      console.log("❌ Player team not found");
      return "UNKNOWN";
    }

    const teamId = playerTeam.id;
    console.log("👥 Player is in team:", teamId);

    // Si el jugador está en equipo A, gana equipo B y viceversa
    const opponentTeam = teamId === "A" ? "B" : "A";
    console.log("🏆 Opponent team (winner):", opponentTeam);

    return opponentTeam;
  }

  private clearTurnTimer(roomId: string) {
    const timer = this.turnTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.turnTimers.delete(roomId);
      console.log("✅ Turn timer cleared for room:", roomId);
    }
  }

  private async handleTurnTimeout(roomId: string) {
    console.log("⏰ Turn timeout for room:", roomId);

    try {
      const battle = await this.battleService.getBattle(roomId);
      if (!battle || battle.isEnded) return;

      // Obtener jugador actual
      const currentPlayer = battle.getCurrentActor();
      console.log("👤 Current player timeout:", currentPlayer);

      this.io.to(roomId).emit("turnTimeout", {
        playerId: currentPlayer,
      });

      // Procesar la acción automática
      const result = await this.battleService.handleAction(
        roomId,
        {
          sourcePlayerId: "",
          targetPlayerId: "",
          type: "BASIC_ATTACK",
        },
        true
      );

      if (result.battleEnded) {
        //  FIN POR ACCIÓN AUTOMÁTICA: enviar recompensas
        try {
          await this.rewardService.awardBattleEnd(
            roomId,
            this.getActiveUsernames(roomId)
          );
        } catch (e) {
          console.error(
            "Failed to award credits on auto-turn end:",
            (e as Error)?.message || e
          );
        }

        this.io.to(roomId).emit("battleEnded", { winner: result.winner });
        this.cleanupRoom(roomId);
      } else {
        // Iniciar timer para el próximo turno
        this.startTurnTimer(roomId);
        this.io.to(roomId).emit("actionResolved", result);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error handling turn timeout:", err.message);
      } else {
        console.error("Error handling turn timeout:", String(err));
      }
    }
  }

  private async handleBattleTimeout(roomId: string) {
    console.log("⏰ Battle timeout (6 minutes) for room:", roomId);

    try {
      const battle = await this.battleService.getBattle(roomId);
      if (!battle || battle.isEnded) return;

      const winnerTeam = this.calculateWinnerByHealth(battle);

      this.battleService.endBattleByDisconnection(roomId, winnerTeam);

      //  FIN POR TIMEOUT GLOBAL: enviar recompensas
      try {
        await this.rewardService.awardBattleEnd(
          roomId,
          this.getActiveUsernames(roomId)
        );
      } catch (e) {
        console.error(
          "Failed to award credits on timeout:",
          (e as Error)?.message || e
        );
      }

      this.io.to(roomId).emit("battleEnded", {
        winner: winnerTeam,
        reason: "Time limit reached (6 minutes)",
        type: "TIMEOUT",
      });

      this.cleanupRoom(roomId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error handling battle timeout:", err.message);
      } else {
        console.error("Error handling battle timeout:", String(err));
      }
    }
  }

  private calculateWinnerByHealth(battle: Battle): string {
    console.log("🏥 Calculating winner by total health");

    let teamAHealth = 0;
    let teamBHealth = 0;

    battle.teams.forEach((team: Team) => {
      const teamHealth = team.players.reduce(
        (total: number, player: Player) => {
          const health = player.heroStats?.hero?.health;
          return total + Math.max(0, health);
        },
        0
      );

      if (team.id === "A") {
        teamAHealth = teamHealth;
      } else if (team.id === "B") {
        teamBHealth = teamHealth;
      }
    });

    console.log("💚 Team A total health:", teamAHealth);
    console.log("💚 Team B total health:", teamBHealth);

    if (teamAHealth > teamBHealth) {
      return "A";
    } else if (teamBHealth > teamAHealth) {
      return "B";
    } else {
      return "DRAW"; // Empate en salud
    }
  }

  /**
   * Limpia todos los timers y datos de una sala
   */
  private cleanupRoom(roomId: string) {
    console.log("🧹 Cleaning up room with timers:", roomId);

    // Limpiar timers
    this.clearTurnTimer(roomId);

    const battleTimer = this.battleTimers.get(roomId);
    if (battleTimer) {
      clearTimeout(battleTimer);
      this.battleTimers.delete(roomId);
    }

    this.battleStartTime.delete(roomId);

    // Limpiar mapas de jugadores
    const socketIds = this.roomPlayerMap.get(roomId) || new Set();
    socketIds.forEach((socketId) => {
      this.playerBattleMap.delete(socketId);
      this.playerSocketMap.delete(socketId);
    });
    this.roomPlayerMap.delete(roomId);

    this.battleService.cleanupRoomBattle(roomId);

    console.log("✅ Room cleanup completed");
  }

  /**
   * Limpia los mapas de un jugador específico
   */
  private cleanupPlayerFromRoom(socketId: string, roomId: string) {
    this.playerBattleMap.delete(socketId);
    const roomPlayers = this.roomPlayerMap.get(roomId);
    if (roomPlayers) {
      roomPlayers.delete(socketId);
      if (roomPlayers.size === 0) {
        this.roomPlayerMap.delete(roomId);
      }
    }
  }

  /**
   * Devuelve los usernames activos en la sala (excluye sockets desconectados).
   */
  private getActiveUsernames(roomId: string): string[] {
    const sids = this.roomPlayerMap.get(roomId) || new Set<string>();
    const names: string[] = [];
    sids.forEach((sid) => {
      // Solo contar sockets que SIGUEN conectados al Server
      if (this.io.sockets.sockets.has(sid)) {
        const name = this.playerSocketMap.get(sid);
        if (name) names.push(name);
      }
    });
    return names;
  }
}
