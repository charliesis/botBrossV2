const Discord = require('discord.js');
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
    let generalCat = guild.channels.cache.find((channel) => channel instanceof Discord.CategoryChannel && channel.name.toLowerCase() === "general")
    let soundboardChannel = guild.channels.cache.find((channel) => channel instanceof Discord.TextChannel && channel.name.toLowerCase() === "soundboard")

    if(!generalCat){
        generalCat = await guild.channels.create("General", {type: 'category'});
    }
    if(!soundboardChannel){
        soundboardChannel = await guild.channels.create("Soundboard", {type: "text", parent: generalCat});
    }
    else{
        soundboardChannel.bulkDelete(100);
    }
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


module.exports.playSound = playSound 
module.exports.emojiReact = emojiReact 
module.exports.createInitialSoundboardChannel = createInitialSoundboardChannel 