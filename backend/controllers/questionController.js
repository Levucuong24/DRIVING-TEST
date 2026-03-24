const mongoose = require("mongoose")
const Question = require("../models/Question")

const normalizeQuestionPayload = (payload) => {
  const normalized = { ...payload }

  if (!normalized.categoryId) {
    normalized.categoryId = null
  } else if (!mongoose.Types.ObjectId.isValid(normalized.categoryId)) {
    delete normalized.categoryId
  }

  return normalized
}

exports.getQuestions = async(req,res)=>{

const questions = await Question.find().populate("categoryId")

res.json(questions)

}

exports.createQuestion = async(req,res)=>{

const question = await Question.create(normalizeQuestionPayload(req.body))

res.json(question)

}

exports.updateQuestion = async(req,res)=>{

const question = await Question.findByIdAndUpdate(
req.params.id,
normalizeQuestionPayload(req.body),
{new:true}
)

res.json(question)

}

exports.deleteQuestion = async(req,res)=>{

await Question.findByIdAndDelete(req.params.id)

res.json({message:"Deleted"})

}
