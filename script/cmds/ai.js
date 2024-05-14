const axios = require("axios");

module.exports = {
  config: {
    name: "ai", 
    aliases: ["openai"], 
    description: "Chat with an AI.",
    author: "Shinpei",
    usage: "[question]", 
    cooldown: 10, 
    access: "anyone", 
    category: "AI", 
    prefix: "both",
  },
  start: async function ({ api, args, react, event, send }) {
    try {
      if (!args.length) {
        return send("Please provide a question to ask.");
      }
      
      const question = encodeURIComponent(args.join(" "));
      const response = await axios.get(`https://shinpei-api.onrender.com/chatgpt?question=${question}`);
      
      if (response.data && response.data.content) {
        return send(response.data.content);
      } else {
        return send("Sorry, I couldn't understand your question.");
      }
    } catch (error) {
      console.error(error);
      return send("An error occurred while processing your request.");
    }
  }
};
