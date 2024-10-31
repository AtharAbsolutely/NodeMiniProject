const express = require("express")
const app = express();
require('dotenv').config()

const userModel = require("./models/user")
const postModel = require("./models/post")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");



const PORT = process.env.PORT;
const secretKey = process.env.SECRET_KEY;

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());





app.get("/", async (req, res) => {

    if (req.cookies.token) {
        res.redirect("/home");
        return;
    }

    res.render("login")
})
app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/home", async (req, res) => {
    console.log("Hello world");
    let user = await getUserFromJwt(req);
    if (user) {

        let postList = await postModel.find().populate("user");
        res.render("home", { postList, user });

    }

})

app.post("/login", async (req, res) => {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (!user) {
        res.status(400).send("Email or Password is incorrect.");
        return;
    }

    bcrypt.compare(password, user.password, async (err, result) => {
        if (result == true) {
            let token = jwt.sign({ email }, secretKey);
            res.cookie("token", token);
            res.redirect("/home");
            return;
        } else {
            res.status(400).send("Email or Password is incorrect.");
            return;
        }
    })

})

app.post("/register", async (req, res) => {
    try {
        let { name, email, password, username, age, gender, imageUrl } = req.body;
        let user = await userModel.findOne({ email });
        if (user) {
            res.status(409).send("Email already exist.");
            return
        }
        user = await userModel.findOne({ username });
        if (user) {
            res.status(409).send("Username already exist.");
            return;
        }

        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, async (err, hash) => {
                let user = await userModel.create({
                    name,
                    email, password: hash,
                    username,
                    age,
                    gender,
                    imageUrl,
                });
                if (user) {
                    let token = jwt.sign({ email }, secretKey);
                    res.cookie("token", token);
                    res.redirect("/home")

                } else {
                    res.status(500).send("Something went wrong.");
                }
            })
        })

    } catch (error) {
        res.status(500).send(error);

    }



})

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
})


app.get("/delete", async (req, res) => {
    if (req.cookies.token) {
        let data = jwt.verify(req.cookies.token, secretKey);
        if (data) {
            await userModel.findOneAndDelete({ email: data.email });
            res.redirect("/");
        }
    }

    res.redirect("/");
})

///Home Pages related pages - Protected Pages

app.get("/myPost", async function (req, res) {

    let user = await getUserFromJwt(req);

    if (user) {

        let postList = await postModel.find({ user: user._id });
        // res.render("my_post", { post: postList });
        res.render("my_post", { postList, user });

        return

    }


})
app.get("/createPost", async function (req, res) {
    await authPageRedirect(req, res, "create_post");
})
app.get("/profile", async function (req, res) {
    await authPageRedirect(req, res, "profile");
})
app.get("/otherProfile/:userId", async function (req, res) {
    let currentUser = await getUserFromJwt(req);
    if (currentUser) {
        let otherUser = await userModel.findOne({ _id: req.params.userId });
        res.render("other_profile", { user: otherUser, myId: currentUser._id });
    }
})

app.get("/postDetail/:postId", async function (req, res) {
    let user = await getUserFromJwt(req);
    if (user) {
        let post = await postModel.findOne({ _id: req.params.postId })
        res.render("post_detail", { post, user });
        return;
    }
    res.redirect("/");
})


app.post("/createPost", async (req, res) => {
    let { title, imageUrl, description } = req.body;
    let user = await getUserFromJwt(req);

    if (user) {
        let post = await postModel.create({
            title,
            imageUrl,
            description,
            user: user._id,
        });
        if (post) {
            user.post.push(post._id);
            await user.save();
            res.redirect("/myPost");
            return;
        }
    }


    res.status(400).send("Something went wrong");
})


app.get("/deletePost/:postId", async function (req, res) {

    let user = await getUserFromJwt(req);
    if (user) {
        let post = await postModel.findOneAndDelete({ _id: req.params.postId, user: user._id });
        if (post) {
            let index = user.post.indexOf(post._id);
            if (index > -1) {
                user.post.splice(index, 1);
                await user.save();
                res.redirect("/");
                return;
            }
        }
    }
    res.status(400).send("Something went wrong");
})


app.get("/likePost/:postID", async (req, res) => {
    let user = await getUserFromJwt(req);
    if (user) {
        let post = await postModel.findOne({ _id: req.params.postID });
        if (post) {
            let index = post.likes.indexOf(user._id);
            if (index === -1) {
                post.likes.push(user._id);
                await post.save();
                await userModel.findOneAndUpdate({ _id: post.user }, {
                    $inc: { totalLikes: 1 },
                });
                res.redirect("back");
                return;
            }
        }
    }
    res.redirect("/");
})


app.get("/unLikePost/:postID", async (req, res) => {
    let user = await getUserFromJwt(req);
    if (user) {
        let post = await postModel.findOne({ _id: req.params.postID });
        if (post) {
            let index = post.likes.indexOf(user._id);

            if (index > -1) {
                post.likes.splice(index, 1);
                await post.save();
                await userModel.findOneAndUpdate({ _id: post.user }, {
                    $inc: { totalLikes: -1 },
                });
                res.redirect("back");
                return;
            }
        }
    }
    res.redirect("/");
})





app.get("/follow/:otherUserId", async function (req, res) {

    let user = await getUserFromJwt(req);
    if (user) {
        let otherUser = await userModel.findOne({ _id: req.params.otherUserId });

        if (otherUser) {
            let index = otherUser.followers.indexOf(user._id);

            if (index == -1) {
                otherUser.followers.push(user._id);
                await otherUser.save();

            }
        }
    }
    res.redirect(req.get("Referrer"))
})
app.get("/unFollow/:otherUserId", async function (req, res) {

    let user = await getUserFromJwt(req);
    if (user) {
        let otherUser = await userModel.findOne({ _id: req.params.otherUserId });

        if (otherUser) {
            let index = otherUser.followers.indexOf(user._id);

            if (index > -1) {
                otherUser.followers.splice(index, 1);
                await otherUser.save();

            }
        }
    }
    res.redirect(req.get("Referrer"))
})

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send("Some thing went wrong");
})


async function authPageRedirect(req, res, page) {
    if (req.cookies.token) {
        let data = jwt.verify(req.cookies.token, secretKey);
        if (data) {
            let user = await userModel.findOne({ email: data.email });
            if (user) {
                res.render(page, { user });
                return;
            }
        }
    }
    res.redirect("/");
}


async function getUserFromJwt(req) {
    if (req.cookies.token) {
        let data = jwt.verify(req.cookies.token, secretKey);
        if (data) {
            let user = await userModel.findOne({ email: data.email });
            return user;
        }
    }
}

app.listen(PORT, () => {
    console.log(`Node server started at PORT:${PORT}`);
});