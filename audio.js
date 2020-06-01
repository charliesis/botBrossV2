const Discord = require('discord.js');
const fs = require('fs')

const soundboardMessage = new Map()
let soundbardMap = new Map();
const JSON_FILE = './audio/soundboard.json';

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

    let soundMsgId = soundboardMessage.get(msgReaction.message.guild.id)

    if(soundMsgId != msg.id) return

    const member = msgReaction.message.guild.member(user);
    let audio = soundbardMap.get(emoji.name);
    if(audio != undefined) playSound(msg, audio, member)

    msgReaction.users.remove(user)
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
        soundboardChannel.messages.fetch({ limit: 1 })
        .then(messages => {
            if(messages.size == 0){
                createSoundboardMessage(soundboardChannel,guild);
                return;
            }
            let msg = messages.first();
            updateMessage(msg);
            soundboardMessage.set(guild.id,msg.id)
        })
        .catch(console.error);
    }
}
function addNewSound(emoji,soundPath,guild){
    let soundboardChannel = guild.channels.cache.find((channel) => channel instanceof Discord.TextChannel && channel.name.toLowerCase() === "soundboard")
    let msg = soundboardChannel.messages.cache.get(soundboardMessage.get(guild.id));

    soundbardMap.set(emoji.name,soundPath);

    updateMessage(msg);
    serialize();
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
        let soundtrackName = (value.slice(8)).slice(0, -4);;
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



module.exports.playSound = playSound 
module.exports.emojiReact = emojiReact 
module.exports.createInitialSoundboardChannel = createInitialSoundboardChannel 