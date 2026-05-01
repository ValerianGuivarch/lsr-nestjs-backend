import {Roll} from "../domain/models/Roll";

export class UtilsRules {
    static getDegats(roll: Roll, originRoll?: Roll): number {
        const attack = originRoll ? originRoll.success || 0 : roll.success || 0
        const resistance = originRoll ? roll.success || 0 : 0
        const diff = attack - resistance;
        return diff > 0 ? Math.ceil(diff / 2) : 0
    }
}