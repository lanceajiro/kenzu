const { readdirSync } = require("fs-extra");

module.exports = {
  config: {
    name: "help", // name of the command
    aliases: ["cmd"],
    description: "Shows the command list and their descriptions", // description of the command
    usage: "[command_name]", // usage of the command
    cooldown: 10, // a cooldown for the command (default is 1 second)
    access: "anyone", // 0 is for everyone, 1 is for bot owner/admin
    category: "general", // category of the command
    prefix: "both", // false if the command doesn't need a prefix
  },
  start: async function ({ api, args, react, event, send }) {
    try {
      const pageNumber = parseInt(args[0]) || 1;
      const commandsPerPage = 15;
      const start = (pageNumber - 1) * commandsPerPage;
      const end = start + commandsPerPage;

      const cmds = process.cwd() + "/script/cmds";

      if (args[0] === "all" || args[0] === "-all" || args[0] === "-a") {
        // Show all commands according to their category
        const allCommands = {};
        const commandFiles = readdirSync(cmds).filter(file => file.endsWith(".js"));

        commandFiles.forEach(file => {
          const path = require("path").join(cmds, file);
          const script = require(path);
          const command = script.config || {};
          const { category } = command;

          if (category) {
            if (!allCommands[category]) {
              allCommands[category] = [];
            }
            allCommands[category].push(command);
          }
        });

        const categories = Object.keys(allCommands);
        const helpMessage = categories.map(category => {
          const commands = allCommands[category];
          const commandNames = commands.map(command => command.name).join(", ");
          return `『 ${category.toUpperCase()} 』\n${commandNames}\n`;
        }).join("\n");

        return send(helpMessage);
      }

      // Read all command files and filter out non-JS files
      const commandFiles = readdirSync(cmds).filter(file => file.endsWith(".js"));

      // Map each command file to its configuration object
      const commandConfigs = commandFiles.map(file => {
        const path = require("path").join(cmds, file);
        const script = require(path);
        return script.config || {}; // Ensure that script.config exists
      });

      const lance = global.jea.admin;

      const isAdminBot = lance.includes(event.senderID); // Check if the user is in the admin bot list

      const filteredCommands = isAdminBot
        ? commandConfigs // Show all commands to admin bot
        : commandConfigs.filter(command => command.access === 0 || command.access === 1);

      const totalCommands = filteredCommands.length;
      const totalPages = Math.ceil(totalCommands / commandsPerPage);

      if (pageNumber < 1 || pageNumber > totalPages) {
        return send(`Invalid page number. Please use a number between 1 and ${totalPages}`);
      }

      const slicedCommands = filteredCommands.slice(start, end);

      const commandList = slicedCommands.map((command, index) => {
        const { name, prefix } = command;
        const commandPrefix = prefix === true ? global.jea.prefix : '';
        return `⦿ ${commandPrefix}${name}`;
      }).join("\n");

      const helpMessage = `List of Commands\n\n${commandList}\n\nPage ${pageNumber}/${totalPages}\nTotal Commands ${totalCommands}`;

      // Get the command name from arguments
      const commandName = (args[0] || "").toLowerCase();

      // Retrieve the command configuration from the commandConfigs array
      const command = filteredCommands.find(command => command.name && command.name.toLowerCase() === commandName);

      if (command) {
        const { name, description, usage, access, cooldown, category, prefix } = command;

        const commandInfo = `『 ${name} 』\n${description}\n\n` + `⦿ Usage: ${prefix === true ? global.jea.prefix : ''}${name} ${usage}\n` +
          `⦿ Access: ${access === 0 ? "everyone" : "bot owner/admin"}\n` +
          `⦿ Cooldown: ${cooldown} seconds\n` +
          `⦿ Category: ${category}`;

        return send(commandInfo);
      }

      return send(helpMessage);
    } catch (error) {
      console.error(error);
      return send("An error occurred while running the command.");
    }
  }
};
