
const Discord = require('discord.js');
const auth = require('./auth.json');
const counter = require("./counter.js");

const client = new Discord.Client();


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
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