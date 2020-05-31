

const memberCountTitle = 'Member Count: '
const channelCountTitle = 'Channel Count: '
const botCountTitle = 'Bot Count: '
const roleCountTitle = 'Role Count: '

class Stats {

    constructor(guild, StatsCatChannel) {
        this.guild = guild
        this.StatsCatChannel = StatsCatChannel
        this.loadChannels()
    }

    async loadChannels() {
        if (!this.StatsCatChannel) {
            let everyoneId = this.guild.roles.everyone.id;
            this.StatsCatChannel = await this.guild.channels.create("Stats", {type: "category"})
            await this.guild.channels.create(memberCountTitle, {type: "voice", parent: this.StatsCatChannel, permissionOverwrites: [
                {
                  id: everyoneId,
                  deny: ['CONNECT'],
               },
            ]})
            await this.guild.channels.create(channelCountTitle, {type: "voice", parent: this.StatsCatChannel, permissionOverwrites: [
                {
                  id: everyoneId,
                  deny: ['CONNECT'],
               },
            ]})
            await this.guild.channels.create(botCountTitle, {type: "voice", parent: this.StatsCatChannel, permissionOverwrites: [
                {
                  id: everyoneId,
                  deny: ['CONNECT'],
               },
            ]})
            await this.guild.channels.create(roleCountTitle, {type: "voice", parent: this.StatsCatChannel, permissionOverwrites: [
                {
                  id: everyoneId,
                  deny: ['CONNECT'],
               },
            ]})
        }

        this.memberCountChannel = this.guild.channels.cache.find((channel) => channel.parent && channel.parent.name === "Stats" && channel.name.includes("Member Count"))
        this.channelCountChannel = this.guild.channels.cache.find((channel) => channel.parent && channel.parent.name === "Stats" && channel.name.includes("Channel Count"))
        this.botCountChannel = this.guild.channels.cache.find((channel) => channel.parent && channel.parent.name === "Stats" && channel.name.includes("Bot Count"))
        this.roleCountChannel = this.guild.channels.cache.find((channel) => channel.parent && channel.parent.name === "Stats" && channel.name.includes("Role Count"))

        this.updateStats()
    }

    updateStats() {
        if (this.memberCountChannel && this.channelCountChannel && this.botCountChannel && this.roleCountChannel) {
            this.memberCountChannel.setName(memberCountTitle + this.getMemberCount())
            this.channelCountChannel.setName(channelCountTitle + this.getChannelCount())
            this.botCountChannel.setName(botCountTitle + this.getBotCount())
            this.roleCountChannel.setName(roleCountTitle + this.getRoleCount())
        }
    }

    getMemberCount() {
        return this.guild.memberCount.toString();
    }

    getChannelCount() {
        return this.guild.channels.cache.size.toString();
    }

    getBotCount() {
        return this.guild.members.cache.filter((member) => member.user.bot).size.toString()
    }

    getRoleCount() {
        return this.guild.roles.cache.size.toString()
    }
}

module.exports.Stats = Stats
