var express = require("express");
var app = express();

var bodyParser = require("body-parser");
var handlebars = require("express-handlebars").create({defaultLayout: "main"});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.set("port", 6986);

app.use(express.static('public'));

var mysql = require("mysql");
var pool = mysql.createPool({
    connectionLimit: 10,
    host: "classmysql.engr.oregonstate.edu",
    user: "cs290_hicksche",
    password: "---",
    database: "cs290_hicksche"
});

//All information from workouts table is displayed
app.get('/', function(req, res){
    var context = {};
    res.render('home', context);
});

//Returns database data
app.get('/get-data', function(req, res, next)
{
    sendTableData(req, res, next);
});

//Add new completed exercise into the table via POST request
app.post('/add', function(req, res, next)
{
    pool.query("INSERT INTO workouts (`name`, `date`, `reps`, `weight`, `lbs`) VALUES (?, ?, ?, ?, ?)",
        [req.body.name,
        req.body.date,
        req.body.reps,
        req.body.weight,
        req.body.unit],
        function(err, result)
        {
            if (err)
            {
                next(err);
                return;
            }
            sendTableData(req, res, next);
        });
});

//Deletes specified data from the table via POST request
app.post('/delete', function(req, res, next)
{
    pool.query("DELETE FROM workouts WHERE id=?",
        [req.body.id],
        function(err, result)
        {
            if (err)
            {
                next(err);
                return;
            }
            sendTableData(req, res, next);
        });
});

//Helper function that queries database for all data and sends to client
function sendTableData(req, res, next)
{
    pool.query('SELECT * FROM workouts ORDER BY name', function(err, rows, fields)
    {
        if (err)
        {
            next(err);
            return;
        }
        res.type('application/json');
        res.send(rows);
    });
}

//Updates specific information in the table via POST request
app.post('/update', function(req, res, next)
{
    pool.query("UPDATE workouts SET name=?, date=?, reps=?, weight=?, lbs=? WHERE id=?",
        [req.body.name,
        req.body.date,
        req.body.reps,
        req.body.weight,
        req.body.unit,
        req.body.id],
        function(err, result)
        {
            if (err)
            {
                next(err);
                return;
            }
            sendTableData(req, res, next);
        });
});

//Resets data in database
app.get('/reset-table',function(req,res,next){
    var context = {};
    pool.query("DROP TABLE IF EXISTS workouts", function(err){ //replace your connection pool with the your variable containing the connection pool
        var createString = "CREATE TABLE workouts("+
        "id INT PRIMARY KEY AUTO_INCREMENT,"+
        "name VARCHAR(255) NOT NULL,"+
        "reps INT,"+
        "weight INT,"+
        "date DATE,"+
        "lbs BOOLEAN)";
        pool.query(createString, function(err){
            context.results = "Table reset";
            res.render('home',context);
        })
    });
});

//404 Page
app.use(function(req, res)
{
    res.status(404);
    res.render("404.handlebars");
});

//500 Page
app.use(function(err, req, res, next)
{
    console.log(err.stack);
    res.type("plain/text");
    res.status(500);
    res.render("500.handlebars");
});

app.listen(app.get("port"), function()
{
    console.log("Express started on http://flip3.engr.oregonstate.edu:" + app.get("port") + "; press Ctrl-C to terminate.");
});