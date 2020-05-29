
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
});

client.login('NDA0MzIyOTc0NDE0NTM2NzA0.XtBbyQ.stpmFl5eCFSSQXCKa5OG83dy0_I');