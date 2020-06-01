const Discord = require('discord.js');
const fs = require('fs')

const soundboardMessage = new Map()
const soundbardMap = new Map([
    ['✅', './audio/If this is your first time with us....mp3'],
    ['❤️', './audio/intro.mp3'],
    ['🧱', './audio/build-a-wall.mp3'],
    ['🧑', './audio/and-his-name-is-john-cena.mp3'],
    ['🧻', './audio/epic.swf_1.mp3'],
    ['🐑', './audio/mountonz.mp3'],
    ['❌', './audio/oh no no no.mp3'],
    ['⛏️', './audio/creeper.mp3'],
    ['📯', './audio/airhorn.mp3'],
    ['🐉', './audio/over9000.mp3'],
    ['👮', './audio/police.mp3'],
  ])

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
    //await deserialize();
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
            soundboardMessage.set(guild.id,msg.id)
        })
        .catch(console.error);
    }
}
function createSoundboardMessage(soundboardChannel,guild){
    let description = "**React with an emoji to play a sound**```";
        for (const [key, value] of soundbardMap) {
            let soundtrackName = (value.slice(8)).slice(0, -4);;
            description+= `. ${key} : ${soundtrackName} \n`
        }
        description += '```';
    
    
        soundboardChannel.send(description).then(sentMsg => {
            soundboardMessage.set(guild.id,sentMsg.id)
            for (const [key, value] of soundbardMap) {
                sentMsg.react(key);
            }
        })
}

function serialize(){
    let jsonData = JSON.stringify([...soundbardMap]);
    fs.writeFileSync(JSON_FILE, jsonData)
}

async function deserialize(){
    let rawdata = fs.readFileSync(JSON_FILE);
    let jsonMap = JSON.parse(rawdata);
    soundbardMap = new Map(JSON.parse(jsonMap));
}



module.exports.playSound = playSound 
module.exports.emojiReact = emojiReact 
module.exports.createInitialSoundboardChannel = createInitialSoundboardChannel 