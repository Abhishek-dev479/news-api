const {User, Bookmark} = require('./mongoose');
// const fetch = require('node-fetch');
// const fetch = import('node-fetch').then(module => module.default);
const jwt = require('jsonwebtoken');
const path = require('path');

let data = [];
const secretKey = 'Hello this is abhishek';
let userId = undefined;

async function getData(keyword, fromDate, toDate, sortBy, response){
    let d = new Date();
    let date = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+(d.getDate()-1);
    let key = 'india';
    let from = date;
    let to = date;
    let sort = 'publishedAt';
    if(keyword && keyword != '') key = keyword;
    if(fromDate != '') from = fromDate;
    if(toDate != '') to = toDate;
    if(sortBy != '') sort = sortBy;
    let url = `https://newsapi.org/v2/everything?q=${key}&from=${from}&to=${to}&sortBy=${sort}&apiKey=fe72599e42024bcd910f141631eb3a02`;
    try{
        console.log('url request being sent');
        const fetch = (await import('node-fetch')).default;
        let res = await fetch(url, {method: 'GET'});
        let result = await res.json();
        console.log('response received');
        if(result.status == 'ok'){
            if(result.articles == []){
                response.send('<h1>No news found</h1>');
                return;
            } 
            else{
                console.log(typeof(result.articles));
                data = result.articles;
                return result;
            }
        }
        else{
            console.log(result.message);
            response.send(result.message);
            return;
        }
    }   
    catch(e){
        response.render('error.ejs');
        return;
    }
}

async function addBookmark(req, res, next){
    let i = req.params.i;
    let a = new Bookmark({
        title: data[i].title,
        urlToImage: data[i].urlToImage,
        description: data[i].description,
        url: data[i].url
    })
    let docs = await User.updateOne({_id: userId}, {$push: {bookmarks: a}});
}

async function showBookmarks(req, res, next){
    console.log('bookmarks loading....');
    try{
        let result = await getBookmarkData();
        if(result.length == 0) res.send(`You don't have any bookmarks`);
        else{
            res.set('Cache-Control', 'no-store');
            res.render('bookmarks.ejs', {data: result});
        }
    }
    catch(error){
        console.log(error);
        res.status(404).send('Error loading the bookmarks');
    }
}

async function getBookmarkData(){
    console.log('user id'+ userId);
    let res = await User.findById(userId);
    // console.log(res.bookmarks);
    return res.bookmarks;
}

async function searchBookmark(req, res, next){
    let title =  data[req.params.i].title;
    let userData = await User.findOne({_id: userId});
    console.log(userData);
    let bookmarks = userData.bookmarks;
    for(let i=0; i<bookmarks.length; i++){
        console.log('bookmark checking...');
        if(bookmarks[i].title == title){
            res.send('bookmark already exists');
            return;
        }
    }
    console.log('bookmark doesn\'t exist');
    next();
    // let present = await Bookmark.find({title: title});
    // console.log('=================================================================');
    // console.log(present);
    // if(present.length == 0){
    //     console.log('=================================================================');
    //     next();
    // }
    // else{
    //     res.send('bookmark already exists');
    // }
}

async function deleteBookmark(req, res, next){
    let n = req.params.i;
    console.log('remove bookamrk: '+n);
    let userData = await User.findById(userId);
    let bookmarks = userData.bookmarks;
    console.log('bookmark before deletion: '+bookmarks.length);
    bookmarks = bookmarks.filter((e, i) => i != n);
    console.log('bookmarks after deletion: '+bookmarks.length);
    await User.updateOne({_id: userId}, {bookmarks: bookmarks});
    res.redirect('/bookmarks');
}

async function getName(res){
    let docs = await User.findById(res.locals.id)
    return docs.name;
}

async function getRouter(req, res, next){
    try{
        let result = await getData('', '', '', '', res);
        if(!result) return;
        res.locals.name = undefined;
        if(res.locals.id){
            let name = await getName(res);
            res.locals.name = name;
        }
        res.render('index.ejs', {data: result.articles});
    }
    catch(e){
        console.log(e);
        res.status(404).render('error.ejs');
    }
};

async function postRouter(req, res, next){
    try{
        let keyword = req.body.keyword;
        let fromDate = req.body.fromDate;
        let toDate = req.body.toDate;
        let sortBy = req.body.sortBy;   
        if(req.body.keyword == '') return;
        let result = await getData(keyword, fromDate, toDate, sortBy, res);
        if(!result){
            return;    
        }
        res.locals.name = undefined;
        if(res.locals.id){
            let name = await getName(res);
            res.locals.name = name;
        }
        res.render('index.ejs', {data: result.articles});
    }
    catch(e){
        console.log(e);
        res.status(404).render('error.ejs');
    }
};

function getSignup(req, res, next){
    renderLogin('signup.ejs', res, '');
}

const maxAge = 24*60*60;

async function postSignup(req, res, next){
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let user = new User({
        name: name,
        email: email,
        password: password,
        bookmarks: []
    })
    try{
        let docs = await user.save();
        let id = docs._id;
        let token = createToken(id);
        res.cookie('jwt', token, {maxAge, httpOnly: true});
        res.redirect('/');
    }
    catch(e){
        console.log(e);
        if(e.code == 11000){
            console.log('User exists');
            renderLogin('signup.ejs', res, 'User already exists!');
            return;
        }
        renderLogin('signup.ejs', res, 'Signup Failed');
    }
}

async function getLogin(req, res, next){
    renderLogin('login.ejs', res, null);
}

function createToken(id){
    return jwt.sign({id}, secretKey, {expiresIn: '2d'});
}

function renderLogin(page, res, msg){
    res.locals.msg = msg;
    res.render(path.join(__dirname, 'views', page));
}

async function postLogin(req, res, next){
    let email = req.body.email;
    let password = req.body.password;
    User.findOne({email: email})
    .then((docs) => {
        if(docs.password == password){
            console.log(password);
            let token = createToken(docs._id);
            res.cookie('jwt', token, {httpOnly: true, expiresIn: maxAge*1000});
            res.redirect('/');
        }
        else{
            renderLogin('login.ejs', res, 'Incorrect Password');
        }
    })
    .catch((err) => {
        console.log(err);
        renderLogin('login.ejs', res, 'Login Failed');
    })
}

async function logout(req, res, next){
    userId = undefined;
    res.clearCookie('jwt');
    res.send('logged out successfully');
}

function authentication(bookmark){
    return function(req, res, next){
        let token = req.cookies.jwt;
        console.log('token: '+token);
        if(token){
            jwt.verify(token, secretKey, (err, decodedToken) => {
                if(err){
                    console.log('error: '+ err);
                    res.redirect('/login');
                }
                else{
                    res.locals.id = decodedToken.id;
                    userId = res.locals.id;
                    console.log('res.locals.id :'+res.locals.id);
                    next();
                }
            })
        }
        else{
            console.log('jwt token not present');
            if(bookmark){
                res.redirect('/login');
            }
            else{
                next(); 
            }
        }
    }
}

function signedIn(req, res, next){
    console.log(userId);
    if(userId){
        console.log('id: '+ userId);
        res.redirect('/');
    }
    else{
        console.log('id');
        next();
    }
}

module.exports = {deleteBookmark, 
    addBookmark, showBookmarks, getBookmarkData,
    searchBookmark, postRouter, getRouter, getData, getSignup, postSignup,
    authentication, getLogin, postLogin, signedIn, logout};

