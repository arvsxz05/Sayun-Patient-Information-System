//Module Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const consolidate = require('consolidate');
const database = require('./database');
const session = require('express-session');
const flash = require('express-flash');

const port = 8000;
const app = express();

app.listen(port, function(){
	console.log('SPIS: Server Running!');
});

app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.use('/uploads/avatars', express.static(__dirname + '/uploads/avatars'));
app.use('/uploads/signatures', express.static(__dirname + '/uploads/signatures'));
app.engine('html', consolidate.nunjucks);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('secret-cookie'));
app.use(session({ secret: 'secret-cookie' }));
app.use(flash());

///////////////////// MODULE ROUTES ////////////////////////

app.use(require('./routes-user-auth'));
app.use(require('./routes-accounts'));
app.use(require('./routes-hospital'));
app.use(require('./routes-spis-instance'));

///////////////////// MIDDLEWARES ////////////////////////

function requireLoggedIn(req, res, next) {
	const currentUser = req.session.user;
	if(!currentUser) {
		return res.redirect('/login');
	}
	next();
}


app.get('/', requireLoggedIn, function (req, res){
	const currentUser = req.session.user;
	res.render('account/home.html', {
		user: currentUser,
		doctor: req.session.doctor,
		secretary: req.session.secretary,
		admin : req.session.admin,
		superuser: req.session.superuser
	});
});

