const gradient= require('gradient-string');
const ok = gradient("green", "cyan", "yellow")
const red = gradient("red", "yellow", "cyan")
const message = gradient("purple", "blue", "cyan")
module.exports.logger = (text) => {
  process.stderr.write(ok(`Jea - ` + text + '\n'));
};
module.exports.warn = (text) => {
  process.stderr.write(red(`Warn - ` + text+'\n'))
};
module.exports.message = (text) => {
  process.stderr.write(message(text+'\n'))
};