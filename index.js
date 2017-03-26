'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const FB_PAGE_ACCESS_TOKEN = "EAAappnhe9Q8BAIlaEPHDZBmmHKjqqQxWyupepAsDJRKnEK5rGlpeO1bqJca1D4wwhKykIgRm2OYnrTb0yRDRZBk5ZBDcUva5ZBBOe5WSNpazPLWviJC3EXUF43JEUZBasU16hMcuzaf9A70uC4RcDWxwbR0GSjZB32E1M6UpZCuagZDZD"
const FB_WEBHOOK_VERIFY_TOKEN = "my_voice_is_my_password_verify_me"

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send('Hello, I am tristan\'s bot. How may I help you?')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === FB_WEBHOOK_VERIFY_TOKEN) {
		res.send(req.query['hub.challenge'])

		setTimeout(function () {
			doSubscribeRequest();
		}, 3000);
	}
	res.send('Error, wrong token')
})

/*app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
	    let event = req.body.entry[0].messaging[i]
	    let sender = event.sender.id
	    if (event.message && event.message.text) {
		    let text = event.message.text
		    sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
	    }
    }
    res.sendStatus(200)
})*/

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
      let event = req.body.entry[0].messaging[i]
      let sender = event.sender.id
      if (event.message && event.message.text) {
  	    let text = event.message.text
  	    if (text === 'Generic') {
  		    sendGenericMessage(sender)
  		    continue
  	    } else if(text === 'Red'){
			sendTextMessage(sender, "Wow! You just picked Red! =)")
			pickColor(sender, "You may pick again (or talk to yourself. =))).")
			continue
		} else if(text === 'Green'){
			sendTextMessage(sender, "You just picked Green! Cool! I'm tired, Bye! =)")
			pickColor(sender, "You may pick again (or talk to yourself. =))).")
			continue
		}
		  sendTextMessage(sender, text.substring(0, 200))
      }
      if (event.postback) {
		  let payload = event.postback.payload

		  if(payload === 'getStarted') {
			  pickColor(sender, "Welcome! I think I need to rest for now. Just send your message and i'll echo it back to you. But first, try to pick a color, it's fun.");
			  continue
		  } else {
			  let text = JSON.stringify(event.postback)
			  sendTextMessage(sender, "Postback received: " + text.substring(0, 200), FB_PAGE_ACCESS_TOKEN)
		  }
  	    continue
      }
    }
    res.sendStatus(200)
})

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
	createGetStarted();
})

function callThreadSettingsAPI(data) { //Thread Reference API
	request({
		uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
		qs: { access_token: FB_PAGE_ACCESS_TOKEN },
		method: 'POST',
		json: data

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log("Thread Settings successfully changed!");
		} else {
			console.error("Failed calling Thread Reference API", response.statusCode, response.statusMessage, body.error);
		}
	});
}

function pickColor(sender,text) {
	let messageData = {
		text:text,
		"quick_replies":[
			{
				"content_type":"text",
				"title":"Red",
				"payload":"pickedRed",
				"image_url":"https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Disc_Plain_red.svg/2000px-Disc_Plain_red.svg.png"
			},
			{
				"content_type":"text",
				"title":"Green",
				"payload":"pickedGreen",
				"image_url":"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Ski_trail_rating_symbol-green_circle.svg/2000px-Ski_trail_rating_symbol-green_circle.svg.png"
			}
		]
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:FB_PAGE_ACCESS_TOKEN},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

function createGetStarted() {
	var data = {
		setting_type: "call_to_actions",
		thread_state: "new_thread",
		call_to_actions:[
			{
				payload:"getStarted"
			}
		]
	};
	callThreadSettingsAPI(data);
}

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:FB_PAGE_ACCESS_TOKEN},
	    method: 'POST',
		json: {
		    recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
		    console.log('Error sending messages: ', error)
		} else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}

function sendGenericMessage(sender) {
    let messageData = {
	    "attachment": {
		    "type": "template",
		    "payload": {
				"template_type": "generic",
			    "elements": [{
					"title": "First card",
				    "subtitle": "Element #1 of an hscroll",
				    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
				    "buttons": [{
					    "type": "web_url",
					    "url": "https://www.messenger.com",
					    "title": "web url"
				    }, {
					    "type": "postback",
					    "title": "Postback",
					    "payload": "Payload for first element in a generic bubble",
				    }],
			    }, {
				    "title": "Second card",
				    "subtitle": "Element #2 of an hscroll",
				    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
				    "buttons": [{
					    "type": "postback",
					    "title": "Postback",
					    "payload": "Payload for second element in a generic bubble",
				    }],
			    }]
		    }
	    }
    }
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:FB_PAGE_ACCESS_TOKEN},
	    method: 'POST',
	    json: {
		    recipient: {id:sender},
		    message: messageData,
	    }
    }, function(error, response, body) {
	    if (error) {
		    console.log('Error sending messages: ', error)
	    } else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}

function doSubscribeRequest() {
	request({
			method: 'POST',
			uri: "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=" + FB_PAGE_ACCESS_TOKEN
		},
		function (error, response, body) {
			if (error) {
				console.error('Error while subscription: ', error);
			} else {
				console.log('Subscription result: ', response.body);
			}
		});
}

doSubscribeRequest();