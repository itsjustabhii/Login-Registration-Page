import mongoose from 'mongoose'

//Defining Schema(Creating a table)
const userSchema = new mongoose.Schema({
    name:{type:String, required:true, trim:true},
    email:{type:String, required:true, trim:true},
    password:{type:String, required:true, trim:true},
    tc:{type:Boolean, required:true}    //term condition
})

//Model for schema (Model is built for Schema)
const UserModel = mongoose.model("user", userSchema)

export default UserModel