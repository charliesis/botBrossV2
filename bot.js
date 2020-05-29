
const Discord = require('discord.js');
const auth = require('./auth.json');
const counter = require("./counter.js");

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.guilds.cache.forEach(async (guild) => {
        let expandingChannel  = guild.channels.cache.find((channel) => channel instanceof Discord.CategoryChannel && channel.name === "self-expanding")
        if (!expandingChannel) {
            expandingChannel = await guild.channels.create("self-expanding", {type: "category"})
            guild.channels.create('Create channel', {type: "voice", parent: expandingChannel})
        }

        const statsChannel  = guild.channels.cache.find((channel) => channel instanceof Discord.CategoryChannel && channel.name === "Stats")
        if (!statsChannel) {
            guild.channels.create("Stats", {type: "category"})
        }
    })
});

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
        case "ping":
            msg.reply("pong!")
            break;

        case "counter":
            let answ = counter.exec(args);
            msg.reply(answ);
            break;
    
        default:
            msg.reply("invalid command!")
            break;
    }
});


client.login(auth.token);