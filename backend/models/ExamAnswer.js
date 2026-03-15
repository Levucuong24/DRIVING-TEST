const mongoose = require("mongoose")

const examAnswerSchema = new mongoose.Schema({

examId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Exam"
},

questionId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Question"
},

selectedAnswer:Number,

isCorrect:Boolean

})

module.exports = mongoose.model("ExamAnswer",examAnswerSchema)