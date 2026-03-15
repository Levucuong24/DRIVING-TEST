const Question = require("../models/Question")
const Exam = require("../models/Exam")

exports.generateExam = async(req,res)=>{

const questions = await Question.aggregate([
{$sample:{size:25}}
])

res.json(questions)

}

exports.submitExam = async(req,res)=>{

const {answers,userId}=req.body

let correct = 0

answers.forEach(a=>{
if(a.isCorrect) correct++
})

const total = answers.length;
const wrong = total - correct;
const examStatus = wrong >= (2 * total / 3) ? "fail" : "pass";

const exam = await Exam.create({

userId,
score:correct,
totalQuestions:total,
correctAnswers:correct,
status: examStatus

})

res.json(exam)

}

exports.getHistory = async(req,res)=>{
try {
  const { userId } = req.params;
  const exams = await Exam.find({ userId }).sort({ createdAt: -1 });
  res.json(exams);
} catch (error) {
  res.status(500).json({ message: "Server error retrieving history", error: error.message });
}
}