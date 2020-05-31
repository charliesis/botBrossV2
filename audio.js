const Discord = require('discord.js');
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
            console.log(audioPath)
            const dispatcher = connection.play(audioPath);
            dispatcher.on("speaking", speaking => {
                if (!speaking) voiceChannel.leave();
            });
            dispatcher.setVolumeLogarithmic(1.5);
        })
        .catch("error : " + console.error);
}

function emojiReact(msgReaction,member){
    let msg = msgReaction.message; 
    let emoji = msgReaction.emoji;
    
    //console.log(emoji)
    let audio = soundbardMap.get(emoji.name);
    if(audio != undefined) playSound(msg, audio, member)

    // removerUserReaction(msg,member.UserID)
    msgReaction.remove(member);
    msg.react(emoji.name);
}

async function createInitialSoundboardChannel(client,guild){
    let generalCat = guild.channels.cache.find((channel) => channel instanceof Discord.CategoryChannel && channel.name.toLowerCase() === "general")
    let soundboardChannel = guild.channels.cache.find((channel) => channel instanceof Discord.TextChannel && channel.name.toLowerCase() === "soundboard")
    if(!soundboardChannel){
        soundboardChannel = await guild.channels.create("Soundboard", {type: "text ", parent: generalCat});
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
        for (const [key, value] of soundbardMap) {
            sentMsg.react(key);
        }
    })

    
}

function removerUserReaction(message,UserID){
    console.log(message.reactions.cache)
    message.reactions.cache.forEach(reaction => {
        console.log(UserID)
        reaction.remove(UserID)
    });
}


module.exports.playSound = playSound 
module.exports.emojiReact = emojiReact 
module.exports.createInitialSoundboardChannel = createInitialSoundboardChannel 