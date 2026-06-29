/**
 *
 * Dark Extraction - LootChestObject
 *
 * Interactive chest that opens with a timer and drops loot using rarity-based loot tables.
 *
 */

const { AnimationObject } = require('./animation-object');
const { ObjectsConst } = require('../../../constants');
const { GameConst } = require('../../../../game/constants');
const { LootTable } = require('../../../../rewards/server/loot-table');
const { RewardsDropsProcessor } = require('../../../../rewards/server/rewards-drops-processor');
const { Logger, sc } = require('@reldens/utils');

class LootChestObject extends AnimationObject
{

    constructor(props)
    {
        super(props);
        this.type = ObjectsConst.TYPE_LOOT_CHEST;
        this.eventsPrefix = this.uid+'.'+ObjectsConst.EVENT_PREFIX.LOOT_CHEST;
        this.listenMessages = true;
        this.clientParams.type = ObjectsConst.TYPE_LOOT_CHEST;
        this.clientParams.isInteractive = true;
        this.interactionArea = this.config.getWithoutLogs(
            'server/objects/lootChest/interactionsDistance',
            this.config.getWithoutLogs('server/objects/actions/interactionsDistance', 40)
        );
        this.openTimeMs = this.config.getWithoutLogs('server/objects/lootChest/openTimeMs', 3000);
        this.isOpen = false;
        this.lootTableRewards = sc.get(props, 'lootTableRewards', []);
        this.dropCount = sc.get(props, 'dropCount', 1);
    }

    async executeMessageActions(client, data, room, playerSchema)
    {
        if(false === this.isValidId(data)){
            return false;
        }
        if(false === this.isObjectInteractionMessage(data)){
            return false;
        }
        if(false === this.isValidInteraction(playerSchema.state.x, playerSchema.state.y)){
            return false;
        }
        if(this.isOpen){
            client.send('*', {act: 'loot_chest_already_open', id: this.id});
            return false;
        }
        this.isOpen = true;
        room.broadcast('*', {
            act: 'loot_chest_opening',
            id: this.id,
            playerId: playerSchema.sessionId,
            duration: this.openTimeMs,
            listener: 'raid'
        });
        setTimeout(() => {
            this.dropLoot(room, playerSchema).catch((error) => {
                Logger.error('LootChest drop error.', error);
            });
        }, this.openTimeMs);
        return true;
    }

    async dropLoot(room, playerSchema)
    {
        if(!this.lootTableRewards.length){
            Logger.warning('Loot chest has no rewards.', this.id);
            return false;
        }
        let zoneTier = sc.get(room, 'worldConfig.zoneTier', 1);
        let lootTable = new LootTable(this.lootTableRewards, zoneTier);
        let winningRewards = lootTable.getMultipleRewards(this.dropCount);
        if(!winningRewards.length){
            Logger.warning('No eligible reward from loot table.', this.id);
            return false;
        }
        let targetObject = this;
        let rewardEventData = {
            targetObject,
            itemRewards: winningRewards,
            targetObjectBody: this.objectBody
        };
        await RewardsDropsProcessor.processRewardsDrops(room, rewardEventData);
        room.broadcast('*', {act: 'loot_chest_opened', id: this.id, listener: 'raid'});
        return true;
    }

    isValidId(data)
    {
        return Number(this.id) === Number(sc.get(data, 'id', false));
    }

    isObjectInteractionMessage(data)
    {
        return (ObjectsConst.OBJECT_INTERACTION).toString() === (sc.get(data, 'act', '')).toString();
    }

}

module.exports.LootChestObject = LootChestObject;
