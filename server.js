let express = require('express'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    app = express(),
    port = process.env.PORT || 5000,
    http = require("http"),
    deviceId = '',
    USERNAME = process.env.USERNAME,
    PASSWORD = process.env.PASSWORD,
    DOOR_OPEN = 'open',
    DOOR_CLOSED = 'closed',
    ABOVE_SAFE_HUMIDITY = 'humidity',
    ABOVE_SAFE_TEMPERATURE = 'temperature',
    jsforce = require('jsforce'),
    conn = new jsforce.Connection();

app.use(cookieParser());
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.disable('view cache');
app.use(express.static(__dirname + '/public'));

//login to sfdc/create connection
conn.login(USERNAME, PASSWORD, function(err, res) {
    if (err) { return console.error(err); }
});

//handle get to /
app.get('/',
    function(req, res) {

        let state = (req.param('state')) ? req.param('state') : 'closed';
        if (state === 'multi') {
            console.log('showing multi fridge image for volunteer refrigerators')
            //multipleFridges1k(0, 9, 0); //counter, #of events to fire, getEventTypes
        } else {
            let sid = req.sessionID;
            deviceId = sid.substring(0, 16); //simulate deviceIds
            setState(state, deviceId);
        }
        res.render('index', {
            session: req.session,
            fridgeId: deviceId
        });
    });

let setState = function(door, deviceId) {
    let resetEvent = getEvent(DOOR_CLOSED, deviceId);
    console.log(resetEvent)
    resetEvent.temperature__c = 0;
    conn.sobject("Smart_Fridge_Reading__e").create(resetEvent, function(err, ret) {
        if (err || !ret.success) { return console.error(err, ret); }
        console.log('reset to closed for deviceId=> ' + deviceId + ' :' + ret.id);
        let event = getEvent(door, deviceId);
        console.log(event)
        conn.sobject("Smart_Fridge_Reading__e").create(event, function(err, ret) {
            if (err || !ret.success) { return console.error(err, ret); }
            console.log("state set to " + door + ' for deviceId=> ' + deviceId + ' :' + ret.id);
        });
    });
};

let getEvent = function(state, deviceId) {

    let ts = new Date;
    let event = {
        deviceId__c: deviceId,
        door__c: (state == DOOR_OPEN) ? DOOR_OPEN : DOOR_CLOSED,
        humidity__c: (state == ABOVE_SAFE_HUMIDITY) ? 85.04 : 40.0,
        temperature__c: (state == ABOVE_SAFE_TEMPERATURE) ? 55.0 : 5.0,
        ts__c: ts
    }
    // if (state == ABOVE_SAFE_HUMIDITY) {
    //     delete event.door__c;
    //     delete event.temperature__c;
    // } else if (state == ABOVE_SAFE_TEMPERATURE) {
    //     delete event.door__c;
    //     delete event.humidity__c;
    // }
    return event;
}

let multipleFridges = function() {

}


app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});








////////////////////////
//FUTURE

app.get('/service',
    function(req, res) {
        let state = req.param('state')
        console.log(state)
        if (state === 'multi') {
            console.log('showing multi fridge image for volunteer refrigerators')
            //multipleFridges1k(0, 9, 0); //counter, #of events to fire, getEventTypes
        } else {
            let sid = req.sessionID;
            deviceId = sid.substring(0, 16); //simulate deviceIds
            setState(state, deviceId);
        }
        res.send(state);
    });

