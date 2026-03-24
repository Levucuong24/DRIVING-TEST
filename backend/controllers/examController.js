const mongoose = require("mongoose")
const Question = require("../models/Question")
const Exam = require("../models/Exam")
const ExamAnswer = require("../models/ExamAnswer")

exports.generateExam = async(req,res)=>{
try {
  const { categoryId, amount } = req.query;
  const baseMatch = {};

  if (categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid category" })
    }

    baseMatch.categoryId = new mongoose.Types.ObjectId(categoryId)
  }

  const totalAmount = parseInt(amount) || 25;
  if (totalAmount < 3) {
    return res.status(400).json({ message: "Exam must have at least 3 questions." });
  }
  const regularSize = totalAmount - 3;

  const criticalQuestions = await Question.aggregate([
    { $match: { ...baseMatch, isCritical: true } },
    { $sample: { size: 3 } }
  ])

  if (criticalQuestions.length < 3) {
    return res.status(400).json({
      message: "Not enough critical questions. At least 3 critical questions are required to generate an exam."
    })
  }

  const excludedIds = criticalQuestions.map((question) => question._id)

  const regularQuestions = await Question.aggregate([
    { $match: { ...baseMatch, isCritical: { $ne: true }, _id: { $nin: excludedIds } } },
    { $sample: { size: regularSize } }
  ])

  if (regularQuestions.length < regularSize) {
    return res.status(400).json({
      message: `Not enough questions to generate an exam with ${totalAmount} questions.`
    })
  }

  const questions = [...criticalQuestions, ...regularQuestions].sort(() => Math.random() - 0.5)

  res.json(questions)
} catch (error) {
  res.status(500).json({ message: "Failed to generate exam", error: error.message })
}

}

exports.submitExam = async(req,res)=>{
try {
const {answers,userId}=req.body

const questionIds = answers.map((answer) => answer.questionId).filter(Boolean)
const questions = await Question.find({ _id: { $in: questionIds } }).select("_id correctAnswer isCritical")
const questionMap = new Map(questions.map((question) => [String(question._id), question]))

let correct = 0
let criticalWrongAnswers = 0
let criticalQuestions = 0

answers.forEach(answer=>{
const question = questionMap.get(String(answer.questionId))

if(!question) return

if (question.isCritical) {
criticalQuestions++
}

const isCorrect = answer.selectedAnswer === question.correctAnswer

if(isCorrect) {
correct++
} else if (question.isCritical) {
criticalWrongAnswers++
}
})

const total = answers.length;
const wrong = total - correct;
const failedByCriticalRule = criticalWrongAnswers >= 3;
const failedByScoreRule = wrong >= (2 * total / 3);
const examStatus = failedByCriticalRule || failedByScoreRule ? "fail" : "pass";
const failReason = failedByCriticalRule
  ? "failed_critical_questions"
  : failedByScoreRule
    ? "failed_score_rule"
    : "passed";

const exam = await Exam.create({

userId,
score:correct,
totalQuestions:total,
correctAnswers:correct,
criticalQuestions,
criticalWrongAnswers,
status: examStatus,
failReason

})

const examAnswersData = answers.map(answer => {
  const question = questionMap.get(String(answer.questionId));
  if (!question) return null;
  return {
    examId: exam._id,
    questionId: question._id,
    selectedAnswer: answer.selectedAnswer,
    isCorrect: answer.selectedAnswer === question.correctAnswer
  };
}).filter(Boolean);

if (examAnswersData.length > 0) {
  await ExamAnswer.insertMany(examAnswersData);
}

res.json(exam)
} catch (error) {
  res.status(500).json({ message: "Failed to submit exam", error: error.message })
}

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

exports.getExamDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const answers = await ExamAnswer.find({ examId: id }).populate('questionId');

    res.json({
      exam,
      answers
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch exam details', error: error.message });
  }
}
