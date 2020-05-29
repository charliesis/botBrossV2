
const Discord = require('discord.js');
const auth = require('./auth.json');
const counter = require("./counter.js");
const Stats = require('./stats').Stats
const unirest = require('unirest');

const client = new Discord.Client();

const statsMap = new Map()

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

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
        setTimeout(() => {   
        }, 500);
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

client.on('message', msg => {
    if (!msg.content.startsWith(auth.prefix) || msg.author.bot) return;

	const args = msg.content.slice(auth.prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

    switch (command) {
        case "ping":{
            msg.reply("pong!");
            break;
        }
        case "counter":{
            let answer = counter.exec(args);
            msg.reply(answer);
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
        default:{
            msg.reply("invalid command!")
            break;
        }
    }
});


client.login(auth.token);