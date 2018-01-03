let express = require('express'),
    app = express(),
    port = process.env.PORT || 5000,
    http = require("http"),
    username = process.env.USERNAME,
    password = process.env.PASSWORD,
    jsforce = require('jsforce'),
    conn = new jsforce.Connection();

//login to sfdc/create connection
conn.login(username, password, function(err, res) {
    if (err) { return console.error(err); }
});


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.disable('view cache');
app.use(express.static(__dirname + '/public'));

app.get('/',
    function(req, res) {
        let door = (req.param('door')) ? req.param('door') : 'closed';
        moveDoor(door);
        res.render('index', {
            session: req.session,
        });
    });

let moveDoor = function(door) {
    let ts = new Date;
    conn.sobject("Smart_Fridge_Reading__e").create({
        deviceId__c: 'node1',
        door__c: door, // closed, open
        humidity__c: 40.0,
        temperature__c: 5.0,
        ts__c: ts
    }, function(err, ret) {
        if (err || !ret.success) { return console.error(err, ret); }
        console.log("moved the door to " + door +' :' + ret.id);
    });
};



app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});