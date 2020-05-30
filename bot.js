const Discord = require('discord.js');
const auth = require('./auth.json');
const counter = require("./counter.js");
const Stats = require('./stats').Stats
const unirest = require('unirest');
const YoutTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const fs = require('fs')

const client = new Discord.Client();
const youtube = new YoutTube(auth.GOOGLE_API);

const statsMap = new Map()
const queue = new Map();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setActivity('Bob Ross video', {type: "WATCHING"})

    client.guilds.cache.forEach(async (guild) => {
        let expandingChannel  = guild.channels.cache.find((channel) => channel instanceof Discord.CategoryChannel && channel.name === "self-expanding")
        if (!expandingChannel) {
            expandingChannel = await guild.channels.create("self-expanding", {type: "category"})
            guild.channels.create('Create channel', {type: "voice", parent: expandingChannel})
        }

        let statsChannel  = guild.channels.cache.find((channel) => channel instanceof Discord.CategoryChannel && channel.name === "Stats")
        statsMap.set(guild.id, new Stats(guild, statsChannel))
    })
});

client.on("guildMemberAdd", member => {
    statsMap.get(member.guild.id).updateStats()
})

client.on("guildMemberRemove", member => {
    statsMap.get(member.guild.id).updateStats()
})

client.on("channelCreate", channel => {
    if (channel instanceof Discord.GuildChannel) {
        statsMap.get(channel.guild.id).updateStats()
    }
})

client.on("channelDelete", channel => {
    if (channel instanceof Discord.GuildChannel) {
        statsMap.get(channel.guild.id).updateStats()
    }
})

client.on("roleCreate", role => {
    statsMap.get(role.guild.id).updateStats()
})

client.on("roleDelete", role => {
    statsMap.get(role.guild.id).updateStats()
})

client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState.channel === undefined) 
        return;
    if (newState.channel && newState.channel.parent.name === 'self-expanding' && newState.channel.name === 'Create channel') {
        const numberOfChannels = newState.channel.parent.children.size
        const channel = await newState.guild.channels.create(`Channel ${numberOfChannels}`, {type: "voice", parent: newState.channel.parent})
        newState.setChannel(channel)
    }

    if (oldState.channel && oldState.channel.parent.name === 'self-expanding' && oldState.channel.name != 'Create channel') {
        if (oldState.channel.members.size == 0) {
            oldState.channel.delete()
        }
    }
});

client.on('message', async msg => {
    if (!msg.content.startsWith(auth.prefix) || msg.author.bot) return;

    const args = msg.content.slice(auth.prefix.length).split(/ +/);
    const search = args.slice(1).join(' ');
    const serverQueue = queue.get(msg.guild.id);

    const command = args.shift().toLowerCase();

    switch (command) {
        case "play":{
            
            const voiceChannel = msg.member.voice.channel;
            if(!voiceChannel) return msg.channel.send('Not in a voice channel');
            const permissions = voiceChannel.permissionsFor(msg.client.user);
            if(!permissions.has('CONNECT')){
                return msg.channel.send('Cannot connect to voice channel');
            }
            if(!permissions.has('SPEAK')){
                return msg.channel.send('I cannot speak in this voice channel');
            }

            try {
                const video = await youtube.getVideo(args[1]);
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

            if(!serverQueue) {
                const queueConstruct = {
                    textChannel: msg.channel,
                    voiceChannel: voiceChannel,
                    connection: null,
                    songs: [],
                    volume: 5,
                    playing: true
                };
                queue.set(msg.guild.id, queueConstruct);

                    queueConstruct.songs.push(song);
                    let embedMessage = constructEmbeddedMsgFromVideo(msg.guild,video)
                    msg.channel.send(embedMessage);

                    try {
                        var connection = await voiceChannel.join();
                        queueConstruct.connection = connection;
                        play(msg.guild, queueConstruct.songs[0]);
                    } catch (error) {
                        console.error(error);
                        msg.channel.send('Cannot join voice channel');
                        queue.delete(msg.guild.id);
                        return undefined;
                    }
                } else {
                    serverQueue.songs.push(song);
                    let embedMessage = constructEmbeddedMsgFromVideo(msg.guild,video)
                    msg.channel.send(embedMessage);
                }
            return undefined;
            break;
        }
        case "skip":{
            if(!serverQueue) return msg.channel.send('Nothing to skip');
            serverQueue.connection.dispatcher.end();
            return undefined;
        }
        case "stop":{
            if(!msg.member.voice.channel) return msg.channel.send('You are not in a voice channel!');
            msg.member.voice.channel.leave();
            return undefined;
        }
        case "queue":{
            const serverQueue = queue.get(msg.guild.id);
            if(serverQueue){
                if(serverQueue.songs[1]){
                    console.log(serverQueue.songs.length);
                    var result = '**Queue list**```';
                    for(var i = 1; i < serverQueue.songs.length; i++){
                        result += i + '. ' + serverQueue.songs[i].title + '\n';
                    }
                    msg.channel.send(result + '```');
                } else {
                    msg.channel.send("No queue!");
                }
            } else {
                msg.channel.send("No queue!");
            }
            return undefined;
        }
        case "pause":{
            if(serverQueue && serverQueue.playing){
                serverQueue.playing = false;
                serverQueue.connection.dispatcher.pause();
                return msg.channel.send('Music is paused!');
            }
            return msg.channel.send('No music playing!');
        }
        case "resume":{
            if(serverQueue && !serverQueue.playing){
                serverQueue.playing = true;
                serverQueue.connection.dispatcher.resume();
                return msg.channel.send('Music was resumed!');
            }
            return msg.channel.send('No music playing!');
        }
        case "ping":{
            msg.reply("pong!");
            break;
        }
        case "counter":{
            let answer = counter.exec(args);
            msg.channel.send(answer);
            break;
        }
        case "meme":{
            let request = unirest.get('https://meme-api.herokuapp.com/gimme');
            console.log("meme");
            request.then((response) => {
                let body = response.body;
                let answer = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(body.title)
                    .setURL(body.postLink)
                    .setDescription(`subreddit : ${body.subreddit}`)
                    .setImage(body.url);

                console.log(answer);
                msg.reply(answer);
            });
            break;
        }
        case "quote":
            fs.readFile('./quotes.txt', (err, data) => {
                const content = String(data).split('\n')

                msg.reply(content[Math.floor(Math.random() * content.length)])
            })
            break;
        case "hello":{
            let voiceChannel = msg.member.voice.channel;
            if (!voiceChannel)  return msg.reply("Welcome back! Glad you could make it.")

            voiceChannel.join()
                .then(connection => {
                    const dispatcher = connection.play('./audio/intro.mp3');
                    dispatcher.on("speaking", speaking => {
                        if (!speaking) voiceChannel.leave();
                    });
                })
                .catch("error : " + console.error);
            break;
        }
        case "roll":{
            if(args[0] == undefined) args[0] = 10;
            msg.reply(Math.round(Math.random() * args[0]));
            break;
        } 
        case "flip":{
            let flip = (Math.floor(Math.random() * 2) == 0) ? "heads" : " tails";
            msg.reply(flip);
            break;
        }
        default:{
            msg.reply("invalid command!")
            break;
        }
    }
});

function play(guild, song){
    const serverQueue = queue.get(guild.id);

    if(!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    const dispatcher = serverQueue.connection.play(ytdl(song.url))
        .on('speaking', (speaking) =>{
            if(!speaking){
                console.log('Song ended!');
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            }
        })
        .on('error', error => console.error(error));
    dispatcher.setVolumeLogarithmic(5 / 5);
}

function constructEmbeddedMsgFromVideo(guild, video){
    const serverQueue = queue.get(guild.id);
    const posInQueue = serverQueue.songs.length-1;

    const embededMessage = new Discord.MessageEmbed()
    .setTitle(video.title)
    .setDescription(video.shortURL )
	.setThumbnail(video.thumbnails.default.url)
	.addFields(
		{ name: 'Video duration', value: `${video.duration.minutes} : ${video.duration.seconds}` ,inline: true},
		{ name: 'Channel', value: video.channel.title, inline: true },
        { name: 'Position in queue', value: posInQueue, inline:true},
    );
    
    return embededMessage;
}


client.login(auth.token);