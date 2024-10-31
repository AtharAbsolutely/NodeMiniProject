const mongoose = require("mongoose")

mongoose.connect(`${process.env.MONGODB_URI}/miniSocialProject`)
    .then(function () {
        console.log("MongoDb Connected");
    })
    .catch(function (err) {
        console.log(err);

    });

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,

    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,


    },
    password: {
        type: String,
        required: true,
    },
    age: Number,
    imageUrl: {
        type: String
        , default: "https://picsum.photos/200",
    },
    gender: {
        type: String,
        trim: true,
        lowercase: true,

        enum: ["male", "female"]
    },
    post: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ],
    totalLikes: {
        type: Number,
        default: 0,
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ]
})

module.exports = mongoose.model("user", userSchema)