const postModel = require('../Model/postsModel')
const userModel = require('../Model/userModel')
const multer = require('multer');
const Post = postModel.data.post;
const User = userModel.user;
const jwt = require('jsonwebtoken');
const key = process.env.JWT_SECRET_KEY;

// const  {initSocketIo} = require('../index');
// const io = initSocketIo;
// GETTING ALL POSTS

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
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
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 5 }, fileFilter: fileFilter });

async function getAllPosts(req, res, next) {
    try {
        const Posts = await Post.find().populate('author', 'username').lean();
        const ChangedPosts = JSON.stringify(Posts);
        console.log("Sending Posts");
        return res.status(200).send(ChangedPosts);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Can't fetch posts at the moment" })
    }

}

// CREATING A POST

async function createPost(req, res, next) {
    try {
        const currentUser = await User.findById(req.user.userId);
        // console.log(currentUser,req.user);

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.setHeader("Content-Type", "multipart/form-data");
        // RQST DATA 
        const { Mood, title, caption, hashtags } = req.body;
        const token = req.headers.authorization.split(" ")[1]
        const Decoded = jwt.decode(token, key);
        // console.log(Decoded.userId)
        // console.log(author);
        const author = Decoded.userId;
        console.log(author);
        if (!author) {
            return res.status(400).json({ message: "Author is required" })
        }
        const images = req.file ? req.file.filename : "";
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${images}`
        const newPost = new Post({ Mood, title, caption, hashtags: hashtags ? hashtags.split(" ") : [], images: imageUrl, likes: 0, shares: 0, comments: 0, author: author });
        await newPost.save();
        // console.log(newPost)
        currentUser.posts.push(newPost._id);
        await currentUser.save()
        return res.status(201).json(newPost);
    } catch (error) {
        return res.status(500).json({ message: "Please Try again", error })
        console.log(error)
    }
}

// DELETE A POST
async function DeletePost(req, res, next) {
    try {
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            console.log('Non-authorized')
            return res.status(400).json({ message: "non authorized user" })
        }
        let userId;
        const userDecoded = jwt.verify(token, key, (err, decoded) => {
            if (err) {
                console.log(err);
            }
            console.log(decoded)
            userId = decoded.userId
        })
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: "error" })
        }

        const postToDelete = await Post.findByIdAndDelete(id)
        await User.findByIdAndUpdate(userId, { $pull: { posts: id } })
        return res.status(200).json(postToDelete)
    } catch (error) {
        console.log(error, 'error catched')
        return res.status(400).json(error)
    }
}

// UPDATE/ MODIFY A POST 

async function UpdatePost(req, res, next) {

    try {
        const auth = await req.headers.authorization.split(" ")[1];
        const id = req.params.id;
        const userLiked = jwt.decode(auth);
        console.log(userLiked);
        if (!userLiked) {
            return res.status(400).send({ message: "You are not authorized" })
        }
        if (!id) {
            return res.status(400).json({ message: "error" })
        }
        // finding the post to update
        const postToUpdate = await Post.findById(id);
        let update;
        const isLiked = postToUpdate.likedBy.includes(userLiked.userId);
        // Checking wether the post is already liked by the user
        console.log(postToUpdate)
        if (isLiked) {
            console.log("isLiked")
            update = { $inc: { likes: -1 }, $pull: { likedBy: userLiked.userId }, new: true }

        } else {
            console.log("NotLiked")
            update = { $inc: { likes: 1 }, $addToSet: { likedBy: userLiked.userId } }
        }
        const updatedPost = await Post.findByIdAndUpdate(id, update, { new: true });
        console.log(updatedPost)
        if (!updatedPost) {
            return res.status(400).json({ error: "no post found" })
        }
        // socket.io emits the update to the client 

        // updated post is also returned by the server
        await res.status(200).json(updatedPost);
    } catch (error) {
        console.log(error)
        return res.status(400).json(error)
    }
}

exports.data = { getAllPosts, createPost, DeletePost, UpdatePost, upload };