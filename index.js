const express = require('express');
const App = express();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const env = require("dotenv").config();
//copied below
const http = require('http');
const socketIo = require('socket.io');
//above
const bodyParser = require('body-parser');
const Route1 = require(`./Router/musicRouter`);
const Route2 = require("./Router/userRouter");
const Route3 = require("./Router/authRouter");
const Route4 = require("./Router/postRouter");

// SETTING UP A DIRECTORY TO STORE UPLOADED FILES TO THE SERVER
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('Uploads directory created');
}
// for profilePics
const ProfileDir = path.join(__dirname, 'ProfilePictures');
if (!fs.existsSync(ProfileDir)) {
    fs.mkdirSync(ProfileDir);
    console.log('Profile directory created');
}
// for coverPhotos
const CoverDir = path.join(__dirname, 'CoverPhotos');
if (!fs.existsSync(CoverDir)) {
    fs.mkdirSync(CoverDir);
    console.log('Cover directory created');
}
const server = http.createServer(App);



//MIDDLEWARES WITH ROUTES SETUP WITH SERVER TO SEND DATA
App.use(cors());
App.use('/Uploads', express.static('./Uploads'));
App.use('/ProfilePictures', express.static('./ProfilePictures'));
App.use('/CoverPhotos', express.static('./CoverPhotos'));
App.use(bodyParser.json());
App.use(bodyParser.urlencoded({ extented: true }));
App.use("/", Route3.route.authRouter);
App.use('/api', Route1.route.musicRouter);
App.use('/account', Route2.route.userRouter);
App.use("/feed", Route4.Route.postRouter);


App.listen(8080, () => {
    console.log("Server Connected");

});