let counterMap =  new Map()
const Discord = require('discord.js');

module.exports = {
    exec : function (args){
        
        let answer;

        if(args.length < 1){
            return "Arguments is expected"
        }
        let key;
        let command = args[0];

        switch(command){
            case "start" :
                if(args.length < 2) "Missing counter name"
                key = args[1]
                answer = startCounter(key);
                break;

            case "reset" :
                if(args.length < 2) "Missing counter name"
                key = args[1]
                answer = resetCounter(key);
                break;

            case "delete" :
                if(args.length < 2) "Missing counter name"
                key = args[1]
                answer = deleteCounter(key);
                break;

            case "++" :
                if(args.length < 2) "Missing counter name"
                key = args[1]
                answer = incrementCounter(key);
                break;

            case "--" :
                if(args.length < 2) "Missing counter name"
                key = args[1]
                answer = decrementCounter(key);
                break;

            case "show" :
                if(args.length < 2) "Missing counter name"
                key = args[1]
                answer = showCounter(key);
                break;

            case "all" :
                answer = getAllCounters();
                break;

            case "help" :
            default:
                answer = getHelp();
                break;
        }

        return writeMsg(answer);
    }
}

function getAllCounters(args){
    let answer;
    for (const [key, value] of counterMap.entries()) {
        if(key != "undefined")
        answer += `${key} : ${value} \n`;
      }
    return answer;
}

function getHelp(){
    let answer = "counter start '?' : start counter '?' \n";
    answer += "counter reset '?' : reset counter '?' to 0 \n";
    answer += "counter delete '?' : delete counter '?' \n";
    answer += "counter ++ '?' : increment counter '?' by 1 \n";
    answer += "counter -- '?' : decrement counter '?' by 1 \n";
    answer += "counter all : show value of all counters \n";
    answer += "counter help : get help \n";

    return answer;
}

function startCounter(key){
    if(counterMap.has(key)){
        return `Counter for ${key} already exists`
    }
    counterMap.set(key,0)
    return `Created a counter for ${key}`

}

function resetCounter(key){
    if(!counterMap.has(key)){
        return `Counter ${key} doesn't exist`
    }
    counterMap.set(key,0)
    return `Reseted  counter ${key} to 0`
}
function deleteCounter(key){
    if(!counterMap.has(key)){
        return `Counter ${key} doesn't exist`
    }
    counterMap.delete(key)
    return `Counter ${key} has been deleted`
}

function incrementCounter(key){
    if(!counterMap.has(key)){
        return `Counter ${key} doesn't exist`
    }
    let value = counterMap.get(key)
    let newValue = value+1;
    counterMap.set(key,newValue)
    return `${key} : ${newValue}`
}
function decrementCounter(key){
    if(!counterMap.has(key)){
        return `Counter ${key} doesn't exist`
    }
    let value = counterMap.get(key)
    let newValue = value-1;
    counterMap.set(key,newValue)
    return `${key} : ${newValue}`
}

function showCounter(key) {  
    if(!counterMap.has(key)){
        return `Counter ${key} doesn't exist`
    }
    let value = counterMap.get(key)
    return `${key} : ${value}`
}

function writeMsg(msg){
    return new Discord.MessageEmbed()
    .setColor(0xCF40FA)
    .addField('Counter',msg);
}