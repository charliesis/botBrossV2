const Discord = require('discord.js');
const fs = require('fs')
const https = require('https')

const soundboardMessage = new Map()
let soundbardMap = new Map();
const JSON_FILE = './audio/soundboard.json';

const addMessages = new Map()
const removeMessages = []

function playSound(msg, audioPath, member = msg.member){
    let voiceChannel = member.voice.channel;
    if (!voiceChannel) return 

    voiceChannel.join()
        .then(connection => {
            const dispatcher = connection.play(audioPath);
            dispatcher.on("speaking", speaking => {
                if (!speaking) voiceChannel.leave();
            });
            dispatcher.setVolumeLogarithmic(1.5);
        })
        .catch("error : " + console.error);
}

function emojiReact(msgReaction, user){
    let msg = msgReaction.message; 
    let emoji = msgReaction.emoji;

    if (addMessages.has(msg.id)) {
        addNewSound(emoji, addMessages.get(msg.id) , msgReaction.message.guild,msg)
        addMessages.delete(msg.id)
        msg.delete();
    }else if(removeMessages.includes(msg.id)){
        deleteSound(msgReaction)  
        removeMessages.slice(removeMessages.indexOf(msg.id));
        msg.delete();
    }else {
        let soundMsgId = soundboardMessage.get(msgReaction.message.guild.id)

        if(soundMsgId != msg.id) return

        const member = msgReaction.message.guild.member(user);
        let audio = soundbardMap.get(emoji.name);
        if(audio != undefined) playSound(msg, audio, member)

        msgReaction.users.remove(user)
    }
}

async function createInitialSoundboardChannel(client,guild){
    await deserialize();
    let generalCat = guild.channels.cache.find((channel) => channel instanceof Discord.CategoryChannel && channel.name.toLowerCase() === "general")
    let soundboardChannel = guild.channels.cache.find((channel) => channel instanceof Discord.TextChannel && channel.name.toLowerCase() === "soundboard")

    if(!generalCat){
        generalCat = await guild.channels.create("General", {type: 'category'});
    }
    if(!soundboardChannel){
        let everyoneId = guild.roles.everyone.id;
        soundboardChannel = await guild.channels.create("Soundboard", {
            type: "text", 
            parent: generalCat,
            permissionOverwrites: [
                {
                  id: everyoneId,
                  deny: ['SEND_MESSAGES'],
               },
            ],
        });
        createSoundboardMessage(soundboardChannel,guild)
    }
    else{
        soundboardChannel.messages.fetch()
        .then(messages => {
            if(messages.size === 0){
                createSoundboardMessage(soundboardChannel,guild);
                return;
            }
            if(messages.size > 1) {
                for (let i = 1; i < messages.size; ++i) {
                    messages.array()[i].delete()
                }
            }
            let msg = messages.first();
            updateMessage(msg);
            soundboardMessage.set(guild.id,msg.id)
        })
        .catch(console.error);
    }
}
function addNewSound(emoji,soundPath,guild, msg){
    let soundboardMsg = getSoundboardMessage(guild);

    soundbardMap.set(emoji.name,soundPath);
    msg.reply(`Successfully added ${emoji.name} - ${soundPath.slice(8).slice(0, -4)} to the soundboard`)

    updateMessage(soundboardMsg);
    serialize();
}

function getSoundboardMessage(guild){
    let soundboardChannel = guild.channels.cache.find((channel) => channel instanceof Discord.TextChannel && channel.name.toLowerCase() === "soundboard")
    return soundboardChannel.messages.cache.get(soundboardMessage.get(guild.id));
}

function createSoundboardMessage(soundboardChannel,guild){
    let description = buildMsgDesrciption();
    
    soundboardChannel.send(description).then(sentMsg => {
        soundboardMessage.set(guild.id,sentMsg.id)
        for (const [key, value] of soundbardMap) {
            sentMsg.react(key);
        }
    })
}

function updateMessage(msg){
    let description = buildMsgDesrciption();
    msg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
    msg.edit(description).then(()=>{
        for (const [key, value] of soundbardMap) {
            msg.react(key);
        }
    });
}

function buildMsgDesrciption(){
    let description = "**React with an emoji to play a sound**```";
    for (const [key, value] of soundbardMap) {
        let soundtrackName = (value.slice(8)).slice(0, -4);
        description+= `. ${key} : ${soundtrackName} \n`
    }
    description += '```';

    return description;
}

function serialize(){
    let jsonData = JSON.stringify([...soundbardMap]);
    fs.writeFileSync(JSON_FILE, jsonData)
}

function deserialize(){
    let rawdata = fs.readFileSync(JSON_FILE);
    let jsonMap = JSON.parse(rawdata);
    soundbardMap = new Map(jsonMap);
}

function addSound(msg) {
    const url = msg.attachments.array()[0].attachment;
    const fileName = msg.attachments.array()[0].attachment.split('/').splice(-1).pop()
    const outPath = `./audio/${fileName}`
    const outFile = fs.createWriteStream(outPath);
    https.get(url, (res) => {
        res.pipe(outFile);
        res.on('close', () => {
            outFile.close();
            msg.delete();
            msg.reply(`React to this message with an emoji to set ${fileName} to the soundboard`).then(message => addMessages.set(message.id, outPath));
        });
    });
}

function removeSound(msg){
    let description = "**React to this message with an emoji to remove it from the soundboard**```";
    for (const [key, value] of soundbardMap) {
        let soundtrackName = (value.slice(8)).slice(0, -4);
        description+= `. ${key} : ${soundtrackName} \n`
    }
    description += '```';
    msg.delete();
    msg.reply(description).then(message => {
        for (const [key, value] of soundbardMap) {
            message.react(key);
        }
        removeMessages.push(message.id);
    });
}
function deleteSound(msgReaction){
    let msg = msgReaction.message; 
    let emoji = msgReaction.emoji;

    let sound = soundbardMap.get(emoji.name)
    let msgTxt;
    console.log(sound)
    if(sound){
        soundbardMap.delete(emoji.name)
        fs.unlink(sound,(err) => {
            if(err)console.log(err); 
            else console.log(`Deleted ${sound}`);
        });
        msgTxt = `Succesfully removed sound ${emoji.name} - ${sound.slice(8).slice(0, -4)} from the soundboard`
    }
    else{
        msgTxt = `No sound attached to ${emoji.name} in the soundboard`
    } 

    msg.reply(msgTxt)
    let soundboardMsg = getSoundboardMessage(msg.guild);
    updateMessage(soundboardMsg);
    serialize();
}


module.exports.addSound = addSound
module.exports.removeSound = removeSound
module.exports.playSound = playSound 
module.exports.emojiReact = emojiReact 
module.exports.createInitialSoundboardChannel = createInitialSoundboardChannel 