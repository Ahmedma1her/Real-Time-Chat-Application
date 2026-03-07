const joi =require("joi") 
const registerSchema=
joi.object({
    username:joi.string().min(3).max(10).required(),
    email:joi.string().email().required(),
    password:joi.string().min(8).max(20).required()
})
module.exports=registerSchema