const fs = require("fs"), axios = require("axios");
const {capcut} = require("betabotz-tools");
const getFBInfo = require("@xaviabot/fb-downloader");
const ytdl = require('ytdl-core');
const link = "https://tikwm.com";
let fbvid = __dirname+"/cache/fbvid.mp4",
  pathaudio = __dirname+"/cache/audio.mp3",
  tiktok = __dirname+"/cache/tiktok.mp4",
  v = __dirname+"/cache/capcut.mp4",
  path = __dirname+"/cache/video.mp4";
module.exports.auto = async function ({api, event, send}){
const txt = event.body
//REGEX
const regexcc = /https:\/\/www\.capcut\.com\/\S+/;
const matchcc = txt.match(regexcc);
  const urlcc = matchcc ? matchcc[0] : null;
const regexyt = /(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/(watch\?v=|v\/)?[a-zA-Z0-9_-]{11}/
const matchh = txt.match(regexyt)
const urlyt = matchh ? matchh[0] : null;
const regexfb = /https:\/\/www\.facebook\.com\/\S+/;
const matches = txt.match(regexfb);
const url = matches ? matches[0] : null;
const regexTt = /https:\/\/vt\.tiktok\.com\/[A-Za-z0-9]+\/?/;

const matchTt = txt.match(regexTt);
 const matchTt1 = txt.match(regexTt);       
const urlTt = matchTt ? matchTt[0] : null;
        const urlTt1 = matchTt1 ? matchTt1[0] : null;
  if(matchTt){
  try {
const img = [];
const tt = (await axios.get(link+'/api?url='+urlTt+'&web=1&hd=1&count=0')).data
  if (tt.data.images){
      for (let i = 0; i < tt.data.images.length; i++){
        let imgPath = __dirname+`/cache/${i}.png`;
        let getimg = (await axios.get(tt.data.images[i], {
      responseType: "arraybuffer"
        })).data;
fs.writeFileSync(imgPath, Buffer.from(getimg, "utf-8"));
img.push(fs.createReadStream(imgPath));
      } 
api.sendMessage({attachment: img}, event.threadID, event.messageID);
  } else {
let vid = encodeURI(link+'/video/media/hdplay/'+tt.data.id+'.mp4');
  const tvid = (await axios.get(vid, {
    responseType: "arraybuffer"
  })).data;
  fs.writeFileSync(tiktok, Buffer.from(tvid, "utf-8"));
  api.sendMessage({attachment: fs.createReadStream(tiktok)}, event.threadID, () => fs.unlinkSync(tiktok), event.messageID)
}
        }
    catch (e){
console.log(e.message)
  }
  }
//FACEBOOK DOWNLOADER
if (matches){
//  api.setMessageReaction("🪷", event.messageID, (err) => {}, true)
const results = await getFBInfo(url);
  let vid = (await axios.get(encodeURI(results.sd),{ responseType:'arraybuffer'} )).data;
  fs.writeFileSync(fbvid, Buffer.from(vid, "utf-8"));
  return api.sendMessage({attachment: fs.createReadStream(fbvid)}, event.threadID, () => fs.unlinkSync(fbvid), event.messageID)
}
//YOUTUBE AUTO DOWBLOAD (mp3)
if (!matchh) return;
 // api.setMessageReaction("🪷", event.messageID, (err) => {}, true)
const streams = ytdl(urlyt, { filter: 'audioonly' });
streams.pipe(fs.createWriteStream(pathaudio)).on('finish', () => {
        api.sendMessage({ attachment: fs.createReadStream(pathaudio)}, event.threadID, () => fs.unlinkSync(pathaudio), event.messageID);
})

//YOUTUBE AUTO DOWNLOAD (mp4)
  if (!matchh) return;
//bm  api.setMessageReaction("🪷", event.messageID, (err) => {}, true)
  const stream = ytdl(urlyt, { filter: 'audioandvideo',
  quality: 'highestvideo',
  format: 'mp4', }); stream.pipe(fs.createWriteStream(path)).on('finish', () => {
        api.sendMessage({ attachment: fs.createReadStream(path)}, event.threadID, () => fs.unlinkSync(path), event.messageID);
  })
  if (matchcc){
      const rescap = await capcut(urlcc);
  var title = rescap.result.title || "No title",
    desc = rescap.result.description || "No Description",
    url1 = encodeURI(rescap.result.video_ori);
  var msg = `[ CAPCUT DOWNLOADER ]\n\nTitle: ${title}\nDescription: ${desc}`
  const vid = (await axios.get(url1, {
    responseType: 'arraybuffer'
  })).data;
fs.writeFileSync(v, Buffer.from(vid, "utf-8"));
  return send({body: msg, attachment: fs.createReadStream(v)})
  }
}
module.exports.config = {
  name: "autodl",
  accessibleby: 0,
  author: "Deku", //https://facebook.com/joshg101
  description: "auto download YouTube/Facebook/Tiktok",
  prefix: "both",
  category: "hidden"
 }