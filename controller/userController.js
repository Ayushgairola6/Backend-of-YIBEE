const express = require("express");
const usermodel = require('../Model/userModel.js')
const User = usermodel.user;
const jwt = require("jsonwebtoken");
const multer = require('multer');
const key = process.env.JWT_SECRET_KEY;

// storage destination for profilePictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'ProfilePictures/');
  }, filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname);
  }
})
// storage destination for coverPhotos
const CoverPhotoStorage =multer.diskStorage({
  destination:(req,res,cb)=>{
    cb(null, 'CoverPhotos/');
  }, filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname);
  }
})

function fileFilter(req, file, cb) {
  if (file.mimetype === 'image/jpeg' || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

function fileFilter2(req, file, cb) {
  if (file.mimetype === 'image/jpeg' || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
}
// for profilePictures
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 5 }, fileFilter: fileFilter });
// for coverPhotos

const CoverUpload =  multer({ storage: CoverPhotoStorage, limits: { fileSize: 1024 * 1024 * 5 }, fileFilter2: fileFilter2 });


const getAllUsers = async (req, res, next) => {
  try {
    const users = await usermodel.user.find().lean();
    res.send((users));;
    next()
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });

  }
}

async function getOneUser(req, res) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
    console.log(token, "error in getOne USer  function")
      res.status(400).json(error)
    }
    const decoded = await jwt.decode(token);
    const id = decoded.userId;
    if (!id) {
      return res.status(401).json({ message: "User not found" })
    }
    const CurrentUser = await User.findById(id).populate('posts').populate('playlist').lean();
    return res.status(200).json(CurrentUser);
  } catch (error) {
    console.log(error)
    return res.status(400).json(error)
  }
}


// UPDATING THE DETAILS OF A USER /
async function UpdateUser(req, res, next) {
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      console.log('no token');
      return res.status(401).send('No token found')
    }
    const decoded = await jwt.decode(token);
    const id = decoded.userId;
    if (!id) {
      console.log('User not found')
      return res.status(200).json({ message: "User not found" })
    }
    const image = req.file ? req.file.filename : "";
    console.log(image, 'image');
    const imageUrl = `${req.protocol}://${req.get('host')}/ProfilePictures/${image}`;
    console.log(imageUrl)
    const CurrentUser = await User.findByIdAndUpdate(id, { image: imageUrl });
    // CurrentUser.image = image;
    console.log(CurrentUser.image)
    await res.status(200).json(CurrentUser);
  } catch (error) {
    console.log(error)
    return res.status(400).json(error)
  }
}

async function AddCoverPhoto(req, res, next) {
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      console.log('no token');
      return res.status(401).send('No account found')
    }
    const decoded = await jwt.decode(token);
    const id = decoded.userId;
    if (!id) {
      console.log('User not found')
      return res.status(200).json({ message: "User not found" })
    }

    const Cover = req.file ? req.file.filename : "";
    const imageUrl = `${req.protocol}://${req.get('host')}/CoverPhotos/${Cover}`;
    const UpdatedUser = await User.findByIdAndUpdate(id, { coverPhoto: imageUrl });
    await res.status(200).json(UpdatedUser);
  } catch (error) {
    console.log(error)
    return res.status(400).json(error)
  }
}

exports.path = { getAllUsers, getOneUser, UpdateUser, AddCoverPhoto, upload ,CoverUpload};