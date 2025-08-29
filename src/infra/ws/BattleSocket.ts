// infrastructure/websockets/BattleSocket.ts
import { Server, Socket } from "socket.io";
import { BattleService } from "../../app/services/BattleService";
import { Battle } from "../../domain/entities/Battle";
import { Player } from "../../domain/entities/Player";
import { Team } from "../../domain/entities/Team";

export class BattleSocket {

  private playerBattleMap = new Map<string, string>();
  private roomPlayerMap = new Map<string, Set<string>>();
  private playerSocketMap = new Map<string, string>();

    // Nuevos mapas para control de tiempo
  private turnTimers = new Map<string, NodeJS.Timeout>(); // roomId -> timer
  private battleTimers = new Map<string, NodeJS.Timeout>(); // roomId -> timer
  private battleStartTime = new Map<string, number>(); // roomId -> timestamp

  constructor(
    private io: Server,
    private battleService: BattleService
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
        const result = await this.battleService.handleAction(roomId, action);
        if (result.battleEnded) {
          this.io.to(roomId).emit("battleEnded", { winner: result.winner });
          this.cleanupRoom(roomId);
        }else{
          this.startTurnTimer(roomId);
        }

        this.io.to(roomId).emit("actionResolved", result);
      } catch (err: any) {
        socket.emit("error", { error: err.message });
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
    const allPlayers = this.getAllPlayers(battle);
    console.log("📋 All players in battle:", allPlayers.map((p: { username: any; }) => p.username));
    
    const disconnectedPlayer = allPlayers.find((p: { username: string; }) => p.username === playerId);
    console.log("👤 Disconnected player found:", !!disconnectedPlayer);
    
    if (!disconnectedPlayer) {
      console.log("❌ Disconnected player not found in battle");
      this.cleanupPlayerFromRoom(socket.id, roomId);
      return;
    }
    
    console.log("🏆 Determining winner team...");
    const winnerTeam = this.getOpponentTeam(battle, disconnectedPlayer);
    console.log("🎉 Winner team:", winnerTeam);
    
    // Terminar batalla y otorgar victoria
    console.log("🔚 Ending battle by disconnection...");
    this.battleService.endBattleByDisconnection(roomId, winnerTeam);
    
    // Notificar a todos los jugadores restantes
    console.log("📢 Emitting battleEnded event to room:", roomId);
    this.io.to(roomId).emit("battleEnded", { 
      winner: winnerTeam, 
      reason: `Player ${playerId} disconnected`,
      type: "DISCONNECTION"
    });
    
    console.log("📢 Emitting playerDisconnected event to room:", roomId);
    this.io.to(roomId).emit("playerDisconnected", { 
      playerId: playerId 
    });

    console.log("🧹 Cleaning up room...");
    this.cleanupRoom(roomId);
    
    console.log("✅ Disconnect handling completed successfully");
  } catch (err: any) {
    console.error("💥 ERROR handling disconnect:", err.message);
    console.error("Stack trace:", err.stack);
  }
}

  /**
   * Inicia el timer de 6 minutos para toda la batalla
   */
  private startBattleTimer(roomId: string) {
    console.log("⏰ Starting 6-minute battle timer for room:", roomId);
    this.battleStartTime.set(roomId, Date.now());
    
    const timer = setTimeout(() => {
      this.handleBattleTimeout(roomId);
    }, 6 * 60 * 1000); // 6 minutos

    this.battleTimers.set(roomId, timer);
  }

  private startTurnTimer(roomId: string) {
    console.log("⏱️ Starting 30-second turn timer for room:", roomId);
    this.clearTurnTimer(roomId);
    const timer = setTimeout(() => {
      this.handleTurnTimeout(roomId);
    }, 30 * 1000); // 30 segundos
    
    this.turnTimers.set(roomId, timer);
    
    // Emitir evento para que el cliente muestre countdown
    this.io.to(roomId).emit("turnTimerStarted", { duration: 30 });
  }

/**
 * Obtiene todos los jugadores de una batalla
 */
private getAllPlayers(battle: any) {
  console.log("🎮 Getting all players from battle");
  console.log("Battle teams:", battle.teams?.length || 0);
  
  if (!battle.teams) {
    console.log("❌ No teams found in battle");
    return [];
  }
  
  const players = battle.teams.flatMap((t: any) => {
    console.log(`Team ${t.name || t.id}: ${t.players?.length || 0} players`);
    return t.players || [];
  });
  
  console.log("📋 Total players found:", players.length);
  return players;
}

private getOpponentTeam(battle: any, player: any): string {
  console.log("🔍 Finding opponent team for player:", player.username);
  
  const playerTeam = battle.teams.find((t: any) => {
    const hasPlayer = t.players.some((p: any) => p.username === player.username);
    console.log(`Team ${t.name || t.id} has player:`, hasPlayer);
    return hasPlayer;
  });
  
  if (!playerTeam) {
    console.log("❌ Player team not found");
    return "UNKNOWN";
  }
  
  const teamId = playerTeam.name || playerTeam.id;
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
        playerId: currentPlayer
      });

      // Procesar la acción automática
      const result = await this.battleService.handleAction(roomId, {
        sourcePlayerId: "",
        targetPlayerId: "",
        type: "BASIC_ATTACK"
      },
      true
    );
      
      if (result.battleEnded) {
        this.io.to(roomId).emit("battleEnded", { winner: result.winner });
        this.cleanupRoom(roomId);
      } else {
        // Iniciar timer para el próximo turno
        this.startTurnTimer(roomId);
        this.io.to(roomId).emit("actionResolved", result);
      }

    } catch (err: any) {
      console.error("Error handling turn timeout:", err.message);
    }
  }


  private async handleBattleTimeout(roomId: string) {
    console.log("⏰ Battle timeout (6 minutes) for room:", roomId);
    
    try {
      const battle = await this.battleService.getBattle(roomId);
      if (!battle || battle.isEnded) return;

      const winnerTeam = this.calculateWinnerByHealth(battle);
      
      this.battleService.endBattleByDisconnection(roomId, winnerTeam);
      
      this.io.to(roomId).emit("battleEnded", { 
        winner: winnerTeam,
        reason: "Time limit reached (6 minutes)",
        type: "TIMEOUT"
      });
      
      this.cleanupRoom(roomId);

    } catch (err: any) {
      console.error("Error handling battle timeout:", err.message);
    }
  }

  private calculateWinnerByHealth(battle: Battle): string {
    console.log("🏥 Calculating winner by total health");
    
    let teamAHealth = 0;
    let teamBHealth = 0;
    
    battle.teams.forEach((team: Team) => {
      const teamHealth = team.players.reduce((total: number, player: Player) => {
        const health = player.heroStats?.hero?.health;
        return total + Math.max(0, health);
      }, 0);
      
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
    socketIds.forEach(socketId => {
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

}
