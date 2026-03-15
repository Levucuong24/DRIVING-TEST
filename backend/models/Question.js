const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema({

question:String,

image:String,

options:[String],

correctAnswer:Number,

categoryId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Category"
},

isCritical:{
type:Boolean,
default:false
}

},{timestamps:true})

module.exports = mongoose.model("Question",questionSchema)