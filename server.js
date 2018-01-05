let express = require('express'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    app = express(),
    port = process.env.PORT || 5000,
    http = require("http"),
    USERNAME = process.env.USERNAME,
    PASSWORD = process.env.PASSWORD,
    DOOR_OPEN = 'open',
    DOOR_CLOSED = 'closed',
    ABOVE_SAFE_HUMIDITY = 'above-safe-humididity',
    ABOVE_SAFE_TEMPERATURE = 'above-safe-temperature',
    jsforce = require('jsforce'),
    conn = new jsforce.Connection(),
    sleep = require('sleep');

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

        let door = (req.param('door')) ? req.param('door') : 'closed';
        if (door === 'multi') {
            multipleFridges(0, 9, 0); //counter, #of events to fire, getEventTypes
        } else {
            let sid = req.sessionID;
            let deviceId = 'node:' + sid.substring(0, 11); //simulate deviceIds
            moveDoor(door, deviceId);
        }
        res.render('index', {
            session: req.session,
        });
    });

let moveDoor = function(door, deviceId) {
    let ts = new Date;
    conn.sobject("Smart_Fridge_Reading__e").create({
        deviceId__c: deviceId,
        door__c: door, // closed, open
        humidity__c: 40.0,
        temperature__c: 5.0,
        ts__c: ts
    }, function(err, ret) {
        if (err || !ret.success) { return console.error(err, ret); }
        console.log("moved the door to " + door + ' for deviceId=> ' + deviceId + ' :' + ret.id);
    });
};

let multipleFridges = function(i, NUMBER_OF_EVENTS, which) {
    /* 
     * making individual calls because if a batch them 
     * the ui changes in bulk and is not as visually appealing
     */

    let state = getState(which, i);
//    let e = getEvent(state, 'node:' + which +':'+ i);
    let e = getEvent(state, 'node:' + i);
    conn.sobject("Smart_Fridge_Reading__e").create(e, function(err, ret) {
        if (err || !ret.success) { return console.error(err, ret); }
        console.log(ret.id)
        console.log(which)
        if (i < NUMBER_OF_EVENTS) {
            sleep.msleep(200);
            multipleFridges(++i, NUMBER_OF_EVENTS, which);
        } else if (which < 2) {//3 groups of events, 0,1,2
            sleep.sleep(7);
            multipleFridges(0, NUMBER_OF_EVENTS, ++which);
        }
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
    console.log(state)
    console.log(event)
    return event;
}

let getState = function(which, i) {
    let state = DOOR_CLOSED;
    if (which == 0) {
        if (i % 2 == 0) state = DOOR_OPEN
        else if (i % 4 == 0) state = ABOVE_SAFE_HUMIDITY
        else if (i % 8 == 0) state = ABOVE_SAFE_TEMPERATURE

    } else if (which == 1) {
        if (i % 2 == 0) state = ABOVE_SAFE_TEMPERATURE
        else if (i % 4 == 0) state = DOOR_OPEN
        else if (i % 8 == 0) state = ABOVE_SAFE_HUMIDITY
    }
    // 2 - DOOR_CLOSED
    return state;
}


app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});