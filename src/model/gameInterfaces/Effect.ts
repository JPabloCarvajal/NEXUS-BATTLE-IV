import { EffectType } from "../Enums"

export default interface Effect {
    effectType: EffectType
    value: string // 1d8 n that shi
    durationTurns: number
}
