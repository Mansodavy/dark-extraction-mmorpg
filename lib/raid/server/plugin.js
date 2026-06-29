/**
 *
 * Dark Extraction - RaidPlugin
 *
 * Server plugin that manages raid loop: temporary inventory, extraction, death loss, and timeout.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { StashManager } = require('../../users/server/stash-manager');
const { Logger, sc } = require('@reldens/utils');

class RaidPlugin extends PluginInterface
{

    setup(props)
    {
        this.events = sc.get(props, 'events', false);
        this.dataServer = sc.get(props, 'dataServer', false);
        this.stashManager = new StashManager();
        this.listenEvents();
    }

    listenEvents()
    {
        if(!this.events){
            return false;
        }
        this.events.on('reldens.joinRoomEnd', this.onJoinRoomEnd.bind(this));
        this.events.on('reldens.itemPickedUp', this.onItemPickedUp.bind(this));
        this.events.on('reldens.extractionComplete', this.onExtractionComplete.bind(this));
        this.events.on('reldens.raidTimeout', this.onRaidTimeout.bind(this));
        this.events.on('reldens.raidPlayerLeave', this.onRaidPlayerLeave.bind(this));
        this.events.on('reldens.playerDeath', this.onPlayerDeathInRaid.bind(this));
    }

    async onJoinRoomEnd(event)
    {
        let room = event.room;
        if(!room || room.roomType !== 'raid'){
            return;
        }
        let playerSchema = event.loggedPlayer;
        if(!playerSchema){
            return;
        }
        playerSchema.extracted = false;
        playerSchema.tempInventory = {};
        Logger.debug('Player joined raid room.', playerSchema.playerName);
    }

    async onItemPickedUp(event)
    {
        let room = event.room;
        if(!room || room.roomType !== 'raid'){
            return;
        }
        let playerSchema = event.playerSchema;
        let itemModel = event.itemModel;
        let addedItem = event.addedItem;
        if(!playerSchema || !itemModel){
            return;
        }
        let tempInventory = playerSchema.tempInventory || {};
        let itemKey = itemModel.key;
        tempInventory[itemKey] = (tempInventory[itemKey] || 0) + 1;
        playerSchema.tempInventory = tempInventory;
        // remove from persistent inventory; stash is only updated on extraction:
        if(addedItem && playerSchema.inventory && sc.isFunction(playerSchema.inventory.manager.removeItem)){
            try {
                await playerSchema.inventory.manager.removeItem(addedItem);
            } catch (error) {
                Logger.error('Could not remove picked-up item from persistent inventory.', error);
            }
        }
    }

    async onExtractionComplete(event)
    {
        let playerSchema = event.playerSchema;
        let client = event.client;
        if(!playerSchema){
            return;
        }
        playerSchema.extracted = true;
        let tempInventory = playerSchema.tempInventory || {};
        for(let itemKey of Object.keys(tempInventory)){
            this.stashManager.addItem(playerSchema.player_id, itemKey, tempInventory[itemKey]);
        }
        playerSchema.tempInventory = {};
        let stash = this.stashManager.getStash(playerSchema.player_id);
        if(client){
            client.send('*', {act: 'stash_update', stash, listener: 'raid'});
        }
        Logger.notice('Player extracted items.', {playerName: playerSchema.playerName, items: Object.keys(tempInventory)});
    }

    async onRaidTimeout(event)
    {
        let playerSchema = event.playerSchema;
        let client = event.client;
        if(!playerSchema || !client || playerSchema.extracted){
            return;
        }
        client.send('*', {act: 'raid_timeout', listener: 'raid'});
        Logger.notice('Raid timeout kicked player.', playerSchema.playerName);
    }

    async onRaidPlayerLeave(event)
    {
        let playerSchema = event.playerSchema;
        let extracted = sc.get(event, 'extracted', false);
        if(!playerSchema || extracted){
            return;
        }
        playerSchema.tempInventory = {};
        Logger.notice('Player left raid without extracting, lost temp inventory.', playerSchema.playerName);
    }

    async onPlayerDeathInRaid(event)
    {
        let room = event.room;
        if(!room || room.roomType !== 'raid'){
            return;
        }
        let playerSchema = event.targetSchema;
        if(!playerSchema){
            return;
        }
        playerSchema.tempInventory = {};
        Logger.notice('Player died in raid, lost temp inventory.', playerSchema.playerName);
    }

}

module.exports.RaidPlugin = RaidPlugin;
