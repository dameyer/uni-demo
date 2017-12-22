let express = require('express'),
    app = express(),
    port = process.env.PORT || 5000;


var http = require("http");

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.disable('view cache');
app.use(express.static(__dirname + '/public'));


app.get('/',
    function(req, res) {
        res.render('index', {
            session: req.session,
        });
    });


app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});