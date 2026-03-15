const Question = require("../models/Question")

exports.getQuestions = async(req,res)=>{

const questions = await Question.find()

res.json(questions)

}

exports.createQuestion = async(req,res)=>{

const question = await Question.create(req.body)

res.json(question)

}

exports.updateQuestion = async(req,res)=>{

const question = await Question.findByIdAndUpdate(
req.params.id,
req.body,
{new:true}
)

res.json(question)

}

exports.deleteQuestion = async(req,res)=>{

await Question.findByIdAndDelete(req.params.id)

res.json({message:"Deleted"})

}