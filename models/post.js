const mongoose = require("mongoose");


const postSchema = mongoose.Schema({
    title: String,
    description: String,
    imageUrl: { type: String, default: "https://picsum.photos/600" },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }
})

module.exports = mongoose.model("post", postSchema);