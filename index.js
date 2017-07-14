var httpMod = require('http')
var bodyParser = require('body-parser')
var BotMod = require('messenger-bot')
var AlexaMod = require('alexa-app');
var express = require('express');
var app = express();
app.set('port', (process.env.PORT || 5555));

const r = require('request');
const urlHead = process.env.PAL_ENDPOINT;

/********************
 * Messenger Bot
 *******************/
var bot = new BotMod({
  token: process.env.FB_MESSENGER_TOKEN,
  verify: process.env.FB_MESSENGER_VERIFY,
  app_secret: process.env.FB_MESSENGER_SECRET,
})

bot.on('test', function(err) {
  console.log('Hey!');
})

bot.on('error', function(err) {
  console.log(err.message)
})

function sendMessage( text ) {
  bot.sendMessage(process.env.FB_USER_ID, {'text': text}, function(err) {});
}

bot.on('message', (payload, reply) => {
  console.log(payload);
  var text = payload.message.text
  var message = payload.message.text;

  bot.getProfile(payload.sender.id, (err, profile) => {
    if (err) {
      console.log(err);
    }
    if( profile ) {
      r.post({url: urlHead + 'converse', form: {input: message}}, function(err, httpResponse, body) {
        console.log("Got response");
        console.log( err );
        console.log( body );
        console.log( httpResponse);
        var data = JSON.parse(body);
        sendMessage( data.message );
      });
    }
  })
})

/********************
 * Alexa Setup
 *******************/
var alexa = new AlexaMod.app('pal');
alexa.intent('Generic',
  {
    "slots": {"EntireResponse": "WILDCARD"}
  },
  function(request,response) {
    r.post({url: urlHead + 'converse', form: {input: request.slot('EntireResponse')}}, function(err, httpResponse, body) {
      console.log("Got response");
      console.log( err );
      console.log( body );
      console.log( httpResponse);
      console.log( httpResponse);
      var data = JSON.parse(body);
      response.say( data.message );
      response.send();
    });
    return false;
  }
)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.get('/', (req, res) => {
  return bot._verify(req, res)
})

app.post('/', (req, res) => {
  bot._handleMessage(req.body)
  res.end(JSON.stringify({status: 'ok'}))
})

app.get('/test', (req, res) => {
  res.send('PAL is accessible via this server');
})

// Setup Alexa endpoint
alexa.express(app, '/alexa/');

httpMod.createServer(app).listen(process.env.PORT || 5555)
