/**
 *
 * Dark Extraction - ExtractionObject
 *
 * Interactive object that allows players to extract from a raid after a timer.
 *
 */

const { AnimationObject } = require('./animation-object');
const { ObjectsConst } = require('../../../constants');
const { GameConst } = require('../../../../game/constants');
const { Logger, sc } = require('@reldens/utils');

class ExtractionObject extends AnimationObject
{

    constructor(props)
    {
        super(props);
        this.type = ObjectsConst.TYPE_EXTRACTION;
        this.eventsPrefix = this.uid+'.'+ObjectsConst.EVENT_PREFIX.EXTRACTION;
        this.listenMessages = true;
        this.clientParams.type = ObjectsConst.TYPE_EXTRACTION;
        this.clientParams.isInteractive = true;
        this.interactionArea = this.config.getWithoutLogs(
            'server/objects/extraction/interactionsDistance',
            this.config.getWithoutLogs('server/objects/actions/interactionsDistance', 40)
        );
        this.extractionTimeMs = this.config.getWithoutLogs(
            'server/objects/extraction/timeMs',
            15000
        );
        this.activeExtractions = {};
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
        let sessionId = playerSchema.sessionId;
        if(this.activeExtractions[sessionId]){
            Logger.info('Player already extracting.', sessionId);
            return false;
        }
        Logger.notice('Extraction started for player: '+sessionId);
        room.broadcast('*', {
            act: 'extraction_start',
            playerId: sessionId,
            objectId: this.id,
            duration: this.extractionTimeMs,
            listener: 'raid'
        });
        this.activeExtractions[sessionId] = setTimeout(() => {
            this.completeExtraction(room, playerSchema, sessionId).catch((error) => {
                Logger.error('Extraction completion error.', error);
            });
        }, this.extractionTimeMs);
        return true;
    }

    async completeExtraction(room, playerSchema, sessionId)
    {
        delete this.activeExtractions[sessionId];
        if(!playerSchema || playerSchema.isDeath()){
            Logger.warning('Player is dead or missing, extraction aborted.', sessionId);
            return false;
        }
        let client = room.getClientById(sessionId);
        if(!client){
            return false;
        }
        Logger.notice('Extraction completed for player: '+sessionId);
        playerSchema.extracted = true;
        await room.events.emit('reldens.extractionComplete', {room, playerSchema, client, object: this});
        client.send('*', {act: 'extraction_complete', objectId: this.id, listener: 'raid'});
        room.broadcast('*', {
            act: 'extraction_done',
            playerId: sessionId,
            objectId: this.id,
            listener: 'raid'
        });
        return true;
    }

    isObjectInteractionMessage(data)
    {
        return (ObjectsConst.OBJECT_INTERACTION).toString() === (sc.get(data, 'act', '')).toString();
    }

    isValidId(data)
    {
        return Number(this.id) === Number(sc.get(data, 'id', false));
    }

}

module.exports.ExtractionObject = ExtractionObject;
