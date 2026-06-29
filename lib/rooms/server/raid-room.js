/**
 *
 * Dark Extraction - RaidRoom
 *
 * RoomScene subclass for extraction shooter raids with a duration timer.
 *
 */

const { RoomScene } = require('./scene');
const { RoomsConst } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class RaidRoom extends RoomScene
{

    async onCreate(options)
    {
        await super.onCreate(options);
        this.roomType = RoomsConst.ROOM_TYPE_RAID;
        this.raidDurationMs = sc.get(options.roomData, 'raidDurationMs', 600000);
        this.raidStartTime = Date.now();
        this.raidTimer = setTimeout(() => {
            this.handleRaidTimeout().catch((error) => {
                Logger.error('Raid timeout error.', error);
            });
        }, this.raidDurationMs);
        Logger.notice('RaidRoom created: '+this.roomName+' (duration: '+this.raidDurationMs+'ms).');
    }

    async onLeave(client, consented)
    {
        let playerSchema = this.playerBySessionIdFromState(client.sessionId);
        if(playerSchema){
            await this.events.emit('reldens.raidPlayerLeave', {
                room: this,
                client,
                playerSchema,
                extracted: sc.get(playerSchema, 'extracted', false)
            });
        }
        await super.onLeave(client, consented);
    }

    async onDispose()
    {
        if(this.raidTimer){
            clearTimeout(this.raidTimer);
            this.raidTimer = false;
        }
        await super.onDispose();
    }

    async handleRaidTimeout()
    {
        Logger.notice('Raid timeout for room: '+this.roomName);
        for(let client of this.clients){
            let playerSchema = this.playerBySessionIdFromState(client.sessionId);
            if(!playerSchema){
                continue;
            }
            await this.events.emit('reldens.raidTimeout', {room: this, client, playerSchema});
        }
        this.disconnect();
    }

    remainingRaidTime()
    {
        let elapsed = Date.now() - this.raidStartTime;
        return Math.max(0, this.raidDurationMs - elapsed);
    }

}

module.exports.RaidRoom = RaidRoom;
