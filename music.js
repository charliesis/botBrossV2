const auth = require('./auth.json');
const YoutTube = require('simple-youtube-api');
const youtube = new YoutTube(auth.GOOGLE_API);
const ytdl = require('ytdl-core');
const Discord = require('discord.js');

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

    try {
        var video = await youtube.getVideo(args[0]);
    } catch (error) {
        try {
            var videos = await youtube.searchVideos(search, 1);
            var video = await youtube.getVideoByID(videos[0].id);
        } catch (error) {
            console.error(error);
            return msg.channel.send('Cannot find video');
        }
    }
    const song = {
        id: video.id,
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`
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
        dispatcher.setVolumeLogarithmic(5 / 5);
    })

}

function constructEmbeddedMsgFromVideo(guild, video) {
    const serverQueue = queue.get(guild.id);
    const posInQueue = serverQueue.songs.length - 1;

    const embededMessage = new Discord.MessageEmbed()
        .setTitle(video.title)
        .setDescription(video.shortURL)
        .setThumbnail(video.thumbnails.default.url)
        .addFields(
            { name: 'Video duration', value: `${video.duration.minutes} : ${video.duration.seconds.toString().padStart(2, '0')}`, inline: true },
            { name: 'Channel', value: video.channel.title, inline: true },
            { name: 'Position in queue', value: posInQueue, inline: true },
        );

    return embededMessage;
}

module.exports.playUserInput = playUserInput 
module.exports.queue = queue