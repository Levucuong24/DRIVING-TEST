const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

exports.register = async(req,res)=>{

const {name,email,password}=req.body

const hash = await bcrypt.hash(password,10)

const user = await User.create({
name,
email,
password:hash,
role:"user"
})

res.json(user)

}

exports.login = async(req,res)=>{

const {email,password}=req.body

const user = await User.findOne({email})

if(!user){

return res.status(400).json({message:"User not found"})
}

const match = await bcrypt.compare(password,user.password)

if(!match){

return res.status(400).json({message:"Wrong password"})
}

const token = jwt.sign(
{id:user._id,role:user.role},
process.env.JWT_SECRET
)

res.json({token,user})

}
