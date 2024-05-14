const app = require('express')();
const port = process.env.PORT || 3000;
app.get('/', async function (req, res) {
  res.send('<marquee>Bot is running</marquee>')
})
app.listen(port, () => {
  console.log('Bot is running on port ' + port)
})