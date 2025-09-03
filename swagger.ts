import swaggerJsdoc from 'swagger-jsdoc';

const doc = {
    openapi: "3.0.0",
    info: {
        title: 'Servidor Autoritativo del Juego The Nexus Battle IV: A New Hope',
        description: 'Documentación oficial del servidor del juego The Nexus Battle IV: A New Hope',
        version: '1.0.0',
    },
    host: `localhost:${process.env["PORT"] || 8080}`,
    basePath: '/',
    schemes: ['http'],
    tags: [
        {
            name: 'Rooms',
            description: 'Endpoints para gestión de salas (rooms)'
        }
    ],
    components: {
        schemas: {
            Player: {
                type: 'object',
                description: 'Jugador dentro de una sala o batalla',
                properties: {
                    username: { type: 'string', description: 'Nombre de usuario del jugador' },
                    heroLevel: { type: 'integer', description: 'Nivel del héroe' },
                    ready: { type: 'boolean', description: 'Indica si el jugador está listo' },
                    heroStats: { $ref: '#/components/schemas/HeroStats', description: 'Estadísticas del héroe' }
                }
            },
            HeroStats: {
                type: 'object',
                description: 'Estadísticas completas del héroe',
                properties: {
                    hero: { $ref: '#/components/schemas/Hero', description: 'Datos del héroe' },
                    equipped: { $ref: '#/components/schemas/Equipped', description: 'Equipamiento del héroe' }
                }
            },
            Hero: {
                type: 'object',
                description: 'Entidad de héroe',
                properties: {
                    heroType: { type: 'string', description: 'Tipo de héroe' },
                    level: { type: 'integer', description: 'Nivel' },
                    power: { type: 'integer', description: 'Poder' },
                    health: { type: 'integer', description: 'Salud' },
                    defense: { type: 'integer', description: 'Defensa' },
                    attack: { type: 'integer', description: 'Ataque' },
                    attackBoost: { $ref: '#/components/schemas/AttackBoost', description: 'Mejora de ataque' },
                    damage: { $ref: '#/components/schemas/Damage', description: 'Daño base' },
                    specialActions: {
                        type: 'array',
                        description: 'Acciones especiales',
                        items: { $ref: '#/components/schemas/SpecialAction' }
                    },
                    randomEffects: {
                        type: 'array',
                        description: 'Efectos aleatorios',
                        items: { $ref: '#/components/schemas/RandomEffect' }
                    }
                }
            },
            AttackBoost: {
                type: 'object',
                description: 'Mejora de ataque',
                properties: {
                    min: { type: 'integer', description: 'Valor mínimo' },
                    max: { type: 'integer', description: 'Valor máximo' }
                }
            },
            Damage: {
                type: 'object',
                description: 'Daño base',
                properties: {
                    min: { type: 'integer', description: 'Valor mínimo' },
                    max: { type: 'integer', description: 'Valor máximo' }
                }
            },
            SpecialAction: {
                type: 'object',
                description: 'Acción especial del héroe',
                properties: {
                    name: { type: 'string', description: 'Nombre de la acción' },
                    actionType: { type: 'string', description: 'Tipo de acción' },
                    powerCost: { type: 'integer', description: 'Costo de poder' },
                    effect: {
                        type: 'array',
                        description: 'Efectos de la acción',
                        items: { $ref: '#/components/schemas/Effect' }
                    },
                    cooldown: { type: 'integer', description: 'Enfriamiento' },
                    isAvailable: { type: 'boolean', description: 'Disponible' }
                }
            },
            RandomEffect: {
                type: 'object',
                description: 'Efecto aleatorio',
                properties: {
                    randomEffectType: { type: 'string', description: 'Tipo de efecto aleatorio' },
                    percentage: { type: 'number', description: 'Porcentaje de aplicación' },
                    valueApply: { $ref: '#/components/schemas/AttackBoost', description: 'Valor aplicado' }
                }
            },
            Effect: {
                type: 'object',
                description: 'Efecto aplicado',
                properties: {
                    effectType: { type: 'string', description: 'Tipo de efecto' },
                    value: { type: 'number', description: 'Valor del efecto' },
                    durationTurns: { type: 'integer', description: 'Duración en turnos' },
                    target: { type: 'string', description: 'Objetivo' }
                }
            },
            Equipped: {
                type: 'object',
                description: 'Equipamiento del héroe',
                properties: {
                    items: {
                        type: 'array',
                        description: 'Ítems equipados',
                        items: { $ref: '#/components/schemas/Item' }
                    },
                    armors: {
                        type: 'array',
                        description: 'Armaduras equipadas',
                        items: { $ref: '#/components/schemas/Armor' }
                    },
                    weapons: {
                        type: 'array',
                        description: 'Armas equipadas',
                        items: { $ref: '#/components/schemas/Weapon' }
                    },
                    epicAbilites: {
                        type: 'array',
                        description: 'Habilidades épicas',
                        items: { $ref: '#/components/schemas/EpicAbility' }
                    }
                }
            },
            Item: {
                type: 'object',
                description: 'Ítem del juego',
                properties: {
                    name: { type: 'string', description: 'Nombre del ítem' },
                    effects: {
                        type: 'array',
                        description: 'Efectos del ítem',
                        items: { $ref: '#/components/schemas/Effect' }
                    },
                    dropRate: { type: 'number', description: 'Probabilidad de caída' }
                }
            },
            Armor: {
                type: 'object',
                description: 'Armadura del juego',
                properties: {
                    name: { type: 'string', description: 'Nombre de la armadura' },
                    effects: {
                        type: 'array',
                        description: 'Efectos de la armadura',
                        items: { $ref: '#/components/schemas/Effect' }
                    },
                    dropRate: { type: 'number', description: 'Probabilidad de caída' }
                }
            },
            Weapon: {
                type: 'object',
                description: 'Arma del juego',
                properties: {
                    name: { type: 'string', description: 'Nombre del arma' },
                    effects: {
                        type: 'array',
                        description: 'Efectos del arma',
                        items: { $ref: '#/components/schemas/Effect' }
                    },
                    dropRate: { type: 'number', description: 'Probabilidad de caída' }
                }
            },
            EpicAbility: {
                type: 'object',
                description: 'Habilidad épica',
                properties: {
                    name: { type: 'string', description: 'Nombre de la habilidad' },
                    compatibleHeroType: { type: 'string', description: 'Tipo de héroe compatible' },
                    effects: {
                        type: 'array',
                        description: 'Efectos de la habilidad',
                        items: { $ref: '#/components/schemas/Effect' }
                    },
                    cooldown: { type: 'integer', description: 'Enfriamiento' },
                    isAvailable: { type: 'boolean', description: 'Disponible' },
                    masterChance: { type: 'number', description: 'Probabilidad de maestro' }
                }
            },
            Team: {
                type: 'object',
                description: 'Equipo de jugadores',
                properties: {
                    id: { type: 'string', description: 'ID del equipo' },
                    players: {
                        type: 'array',
                        description: 'Jugadores en el equipo',
                        items: { $ref: '#/components/schemas/Player' }
                    }
                }
            },
            Battle: {
                type: 'object',
                description: 'Batalla entre equipos',
                properties: {
                    id: { type: 'string', description: 'ID de la batalla' },
                    roomId: { type: 'string', description: 'ID de la sala' },
                    teams: {
                        type: 'array',
                        description: 'Equipos en la batalla',
                        items: { $ref: '#/components/schemas/Team' }
                    },
                    turnOrder: {
                        type: 'array',
                        description: 'Orden de turnos',
                        items: { type: 'string' }
                    },
                    currentTurnIndex: { type: 'integer', description: 'Índice de turno actual' },
                    state: { type: 'string', description: 'Estado de la batalla' },
                    winner: { type: 'string', nullable: true, description: 'Equipo ganador' },
                    isEnded: { type: 'boolean', description: 'Indica si la batalla terminó' }
                }
            },
            Room: {
                type: 'object',
                description: 'Sala de juego',
                properties: {
                    id: { type: 'string', description: 'ID de la sala' },
                    mode: { type: 'string', description: 'Modo de juego' },
                    allowAI: { type: 'boolean', description: 'Permitir IA' },
                    credits: { type: 'integer', description: 'Créditos de la sala' },
                    heroLevel: { type: 'integer', description: 'Nivel de héroe requerido' },
                    ownerId: { type: 'string', description: 'ID del propietario' },
                    players: {
                        type: 'array',
                        description: 'Jugadores en la sala',
                        items: { $ref: '#/components/schemas/Player' }
                    },
                    teamA: {
                        type: 'array',
                        description: 'Jugadores en el equipo A',
                        items: { $ref: '#/components/schemas/Player' }
                    },
                    teamB: {
                        type: 'array',
                        description: 'Jugadores en el equipo B',
                        items: { $ref: '#/components/schemas/Player' }
                    },
                    phase: { type: 'string', description: 'Fase actual de la sala' }
                }
            }
        }
    }
};

const swaggerOptions = {
    encoding: 'utf8',
    failOnErrors: false,
    verbose: false,
    format: 'json',
    swaggerDefinition: doc,
    definition: doc,
    apis: ['./**/*.ts'],
};

const swaggerConfig = swaggerJsdoc(swaggerOptions);
export default swaggerConfig;