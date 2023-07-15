const express = require('express');
const router = express.Router();

const {deleteBookmark, addBookmark, showBookmarks, getBookmarkData, searchBookmark, 
    postRouter, getRouter, getData, getSignup, postSignup, authentication, getLogin,
    postLogin, signedIn, logout} = require('./controllers');


router.get('/', authentication(false), getRouter);
router.post('/', authentication(false), postRouter);

router.get('/signup', signedIn, getSignup);
router.post('/signup', postSignup);

router.get('/login', signedIn, getLogin);
router.post('/login', postLogin);

router.get('/logout', logout);

router.get('/bookmark/:i', searchBookmark, addBookmark);
router.get('/bookmarks',authentication(true), showBookmarks);
router.get('/bookmarks/remove/:i', deleteBookmark);

module.exports = router;