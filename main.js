const path = require('path');
const fs = require("fs");
const X = require("alicezetion");
const { warn, logger } = require("./jea/system/console.js");
const { get, post } = require("axios");
const { join } = require("path");

// Load configuration
global.jea = require(path.join(__dirname, './setup/config.json'));
global.command = new Array();
global.reply = new Array();

// Read credentials
class ChatApp {
    constructor() {
        this.credentials = fs.readFileSync("./setup/instance.json");
        this.checkCredentials();
    }

    checkCredentials() {
        try {
            const credentialsArray = JSON.parse(this.credentials);

            if (!Array.isArray(credentialsArray) || credentialsArray.length === 0) {
                console.error('Please go to setup/instance.json folder and fill in appstate!');
                process.exit(0);
            }
        } catch (error) {
            console.error('Cannot parse JSON credentials string in folder setup/instance.json');
        }
    }
}

const app = new ChatApp();

const appStatePath = path.join(__dirname, "setup", "instance.json");
const appState = JSON.parse(fs.readFileSync(appStatePath, "utf8"));

// Set global variable 
const p = global.jea.prefix 
const operator = global.jea.operator;
const admin = global.jea.admin;
const vip = global.jea.vip;
// Assuming prefix is defined in your config.json

// Other required modules
require('./jea/system/index');
const { exec } = require("child_process");

// Define commandPath
const commandPath = join(__dirname, "script", "cmds");

// Load commands
for (let files of fs.readdirSync(commandPath)) {
    if (files.endsWith(".js")) {
        let script;
        try {
            if (!files.endsWith(".js"))
                return warn("Command Error: File Extension Error");
            script = require(join(commandPath, files));
            logger("Successfully installed command: " + script.config?.name);
        } catch (e) {
            warn("Can't install command: " + files + "\nReason: " + e);
        }
    }
}

// Error handling
process.on("unhandledRejection", (error) => console.error(error));
process.setMaxListeners(0);
require("events").EventEmitter.defaultMaxListeners = 0;

// Initialize chat support
X({ appState }, async function (err, api) {
    if (err) return warn(err);
    api.setOptions(global.jea.setOpt);
    api.listenMqtt(async function (err, event) {
        if (err) warn(err);
        // Start handling events
        if (event.body != null) {
            // Initialize cooldowns object to track command cooldowns
            const cooldowns = {};

            for (let files of fs.readdirSync(commandPath)) {
                if (files.endsWith(".js")) {
                    const pa = join(commandPath, files);
                    const script = require(pa);
                    let s = script.config;
                    function send(text, attachmentPath) {
                        if (attachmentPath) {
                            api.sendMessage({
                                body: text,
                                attachment: fs.createReadStream(attachmentPath)
                            }, event.threadID, (error, messageInfo) => {
                                if (error) {
                                    console.error('Error sending attachment:', error);
                                } else {
                                    console.log('Attachment sent successfully:', messageInfo);
                                }
                            });
                        } else {
                            api.sendMessage(text, event.threadID, event.messageID);
                        }
                    }
                  
                    function react(emoji) {
                        api.setMessageReaction(emoji, event.messageID, (err) => {}, true);
                    }
                    function access(nam) {
                        return send(
                            "You don't have permission to use command " + nam + "!",
                        );
                    }
                    function noPref(nam) {
                        send("Command " + nam + " doesn't need a prefix.");
                    }
                    function yesPref(nam) {
                        send("Command " + nam + "need a prefix.");
                    }
                    let input = event.body;
                    let args = input.split(" ");
                    args.shift();
                    let arg = event.body.split(" ");
                    let t = arg.shift().toLowerCase();
                    let obj = {
                        api,
                        event,
                        react,
                        send,
                        args,
                    };
                    if (script.auto) {
                        script.auto(obj)
                    }
                    if (t == "prefix") return send("Prefix: " + p);
                    if (t == p)
                        return send("Type " + p + "help to view available commands.");

                    // Check for aliases
                    if (s.aliases && s.aliases.includes(t)) {
                        t = s.name; // Set command name to the original name if alias found
                    }

                    // Check cooldown
                    const cooldownKey = `${s.name}-${event.senderID}`;
                    const timeNow = Date.now();
                    const cooldownDuration = (s.cooldown || 0) * 1000;

                    if (cooldowns[cooldownKey] && timeNow - cooldowns[cooldownKey] < cooldownDuration) {
                        const remainingCooldownSeconds = Math.ceil((cooldownDuration - (timeNow - cooldowns[cooldownKey])) / 1000);
                        await send(`Please wait ${remainingCooldownSeconds} seconds before using ${s.name} again.`);
                        return;
                    }

                    // Update the cooldown timestamp for this command
                    cooldowns[cooldownKey] = timeNow;

                    //no prefix
                    if (t == p + s?.name && s?.prefix == false) {
                        return noPref(s.name);
                    }

                    //yes prefix
                    if (t == s?.name && s?.prefix == true) {
                        return noPref(s?.name);
                    }

                    //both prefix and no prefix
                    if (t == s?.name && (s?.prefix == "both" || !s?.prefix)) {
                        // Execute the command without prefix
                        script.start(obj);
                        return;
                    }

                    //permission
                    if (t == p + s?.name || t == s?.name) {
                        if (!(s.access === "anyone" || 
                            (s.access === "operator" && operator.includes(event.senderID)) || 
                            (admin.includes(event.senderID) && s.access === "admin") || 
                            (vip.includes(event.senderID) && s.access === "vip"))) {
                            return send(`You don't have permission to use command ${s.name}!`);
                        }
                    }

                    //start
                    if (t == p + s?.name || t == s?.name) {
                        script.start(obj);
                    } // end
                } // end of file ends with .js
            } // end of loop file
        } // end of event body null
    }); // end of listenMqtt
});
