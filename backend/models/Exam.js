const mongoose = require("mongoose")

const examSchema = new mongoose.Schema({

userId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

score:Number,

totalQuestions:Number,

correctAnswers:Number,

criticalQuestions:Number,

criticalWrongAnswers:Number,

status:String,

failReason:String,

duration:Number

},{timestamps:true})

module.exports = mongoose.model("Exam",examSchema)
