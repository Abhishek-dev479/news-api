const mongoose = require('mongoose');

// Connect to Database;
// mongoose.connect('mongodb://localhost:27017/newsDB');
mongoose.connect('mongodb+srv://newUser_203:thisisapassword@cluster0.j51fwrw.mongodb.net/db-name?retryWrites=true&w=majority');
const bookmarkSchema = new mongoose.Schema({
    title: String,
    urlToImage: String,
    description: String,
    url: String
})

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    bookmarks: [bookmarkSchema] 
})

let Bookmark = mongoose.model('bookmark', bookmarkSchema);

let User = mongoose.model('user', userSchema);

module.exports = {User, Bookmark};