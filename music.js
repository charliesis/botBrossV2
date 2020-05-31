const auth = require('./auth.json');
// const YoutTube = require('simple-youtube-api');
// const youtube = new YoutTube(auth.GOOGLE_API);
const ytdl = require('ytdl-core');
const Discord = require('discord.js');
const youtube = require('scrape-youtube').default;

const queue = new Map();

async function playUserInput(msg, serverQueue, args, search) {

    const voiceChannel = msg.member.voice.channel;
    if (!voiceChannel) {
        return msg.channel.send('Not in a voice channel');
    }

    const permissions = voiceChannel.permissionsFor(msg.client.user);
    if (!permissions.has('CONNECT')) {
        return msg.channel.send('Cannot connect to voice channel');
    }
    if (!permissions.has('SPEAK')) {
        return msg.channel.send('I cannot speak in this voice channel');
    }

    serverQueue.textChannel = msg.channel
    serverQueue.voiceChannel = voiceChannel

    if (!args[0] && serverQueue.songs.length > 0) {
        play(msg.guild, serverQueue.songs[0])
        return
    } else if (!args[0]) {
        return msg.channel.send('Specify song to play!')
    }
    if (args[0].includes('youtube.com')) {
        msg.channel.send('Url links not supported!')
        return
    } 
    else {
        result = await youtube.search(search, {limit: 1, type: 'video'})
    }

    console.log(result)
    const video = result[0]

    const song = {
        id: video.id,
        title: video.title,
        url: video.link
    };

    if (serverQueue.playing) {
        serverQueue.songs.push(song)
    } else {
        serverQueue.songs.push(song);
        play(msg.guild, serverQueue.songs[0])
    }

    let embedMessage = constructEmbeddedMsgFromVideo(msg.guild, video)
    msg.channel.send(embedMessage);

}


function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        return;
    }

    serverQueue.voiceChannel.join().then(connection => {
        serverQueue.connection = connection;
        serverQueue.playing = true
        const dispatcher = serverQueue.connection.play(ytdl(song.url))
            .on('finish', () => {
                serverQueue.playing = false
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            })
            .on('error', error => console.error(error));
        dispatcher.setVolumeLogarithmic(1) 
    })

}

function constructEmbeddedMsgFromVideo(guild, video) {
    const serverQueue = queue.get(guild.id);
    const posInQueue = serverQueue.songs.length - 1;

    const embededMessage = new Discord.MessageEmbed()
        .setTitle(video.title)
        .setDescription(video.link)
        .setThumbnail(video.thumbnail)
        .addFields(
            { name: 'Video duration', value: `${Math.floor(video.duration / 60)} : ${(video.duration % 60).toString().padStart(2, '0')}`, inline: true },
            { name: 'Channel', value: video.channel.name, inline: true },
            { name: 'Position in queue', value: posInQueue, inline: true },
        );

    return embededMessage;
}

module.exports.playUserInput = playUserInput 
module.exports.queue = queue