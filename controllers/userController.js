import UserModel from '../models/User.js'   //importing user model
import bcrypt from 'bcrypt'     //Used for password hasing
import jwt from 'jsonwebtoken'  //to generate a token
import  transporter  from '../config/emailConfig.js'

//User Registration Form
class UserController {
    static userRegistration = async (req, res) => {
        const {name, email, password, password_confirmation, tc} = req.body //All data from frontend(req.body) which is sent is being stored in their respective fields
        const user = await UserModel.findOne({email:email}) //Checks the email given by user is already in the DB. Allows only unique emails to be registered
        if(user){
            res.send({"Status":"Failed", "Message":"Email already exists"})
        } else {
            if(name && email && password && password_confirmation && tc) {  //Check if user has provided all fields of data
                if(password === password_confirmation) {    //checks if password and password_confirmation are matching
                    try{
                        const salt = await bcrypt.genSalt(10)   //Generating a salt for password hashing
                        const hashPassword = await bcrypt.hash(password, salt)  //Hashing password using salt
                        const doc = new UserModel({ //Saving the user details which are entered
                        name: name,
                        email:email,
                        password: hashPassword, //hashed password is stored in the DB
                        tc: tc
                    })
                    await doc.save()    //to save the doc
                    const saved_user = await UserModel.findOne({email:email})    //Obtained user that is been saved
                    
                    //---------Generate JWT Token-----------------
                    const token = jwt.sign({userID:saved_user._id}, process.env.JWT_SECRET_KEY, {expiresIn: '5d'})  //Expiry tells in how many days the password expires.   JWT_secret_key is created by us
                    res.status(201).send({"Status":"Success", "Message":"Registration Success!", "token":token})    //Sending JWT token to the user

                    res.status(201).send({"Status":"Success", "Message":"Registration Success!"})
                    }catch(error) {
                        console.log(error)
                        res.send({"Status":"Failed", "Message":"Unable to register"})
                    }
                }else {
                    res.send({"Status":"Failed", "Message":"Passwords don't match!"})
                }

            }else {
                res.send({"Status":"Failed", "Message":"All fields are required!"})
            }
        }
    }   //userRegistration block ends here


    //User Login
    static userLogin = async(req, res) => {
        try{
            const {email, password} = req.body
            if(email && password) {     //findOne() - finds one document according to the condition
                const user = await UserModel.findOne({email:email}) //Checks the email given by user is already in the DB. Allows only those emails which are present in DB
                if(user != null){   //if user is registered in DB
                    const isMatch = await bcrypt.compare(password, user.password)   //Compares if passsword given by user is equal to password stored in DB
                    if((user.email === email) && isMatch) {  //Checking if both email and password is stored in DB and true
                        //----------GENERATE JWT TOKEN for Successful Login
                        const token = jwt.sign({userID:user._id}, process.env.JWT_SECRET_KEY, {expiresIn: '5d'})
                        res.send({"Status":"Success", "Message":"Login Successful!", "token":token})    //Sending JWT token to the user
                    }else {
                        res.send({"Status":"Failed", "Message":"Email or Password is invalid!"})
                    }
                } else {
                    res.send({"Status":"Failed", "Message":"You are not a registered user"})
                }
            }else {
                res.send({"Status":"Failed", "Message":"All fields are required!"})
            }
        }catch(error) { //logs the error message if Email and Password are not stored in the DB
            console.log(error)
            res.send({"Status":"Failed", "Message":"Unable to Login!"})
        }
    }

    //Change Password   - Only for logged in Users
    static changeUserPassword = async(req, res) => {
        const {password, password_confirmation} = req.body
        if(password && password_confirmation){  //checking if both password fields are filled by the user
            if(password !== password_confirmation){ //Checking if both passwords are same and macth
                res.send({"Status":"Failed", "Message":"Passwords don't match!"})
            } else{ //Hash our password and store it in DB
                const salt = await bcrypt.genSalt(10) 
                const newHashPassword = await bcrypt.hash(password, salt)  //Hashing password using salt
                await UserModel.findByIdAndUpdate(req.user._id, { $set: { password: newHashPassword } })    //update new password in userModel
                res.send({"Status":"Success", "Message":"Password changed successfully!"})
            }
        } else {
            res.send({"Status":"Failed", "Message":"All fields are required!"})
        }
    }

    //Get Logged User Data
    static loggedUser = async(req, res) => {
        res.send({"user":req.user})
    }

    //To send Rest Pasword Mail to the user
    static sendUserPasswordResetEmail = async(req, res) => {
        const {email} = req.body    //get email from user
        if(email){  //check if email is given
            const user = await UserModel.findOne({email:email}) //check if email given by user and email in DB are same
            if(user){
                const secret = user._id + process.env.JWT_SECRET_KEY    //Generating another secret key
                const token = jwt.sign({userID:user._id}, secret, {expiresIn: '15m'})   //Geneating a JWT Token
                const link =`http://127.0.0.1:3000/api/user/reset/${user._id}/${token}`    //Back end link
                // console.log(link)
            //    Link type for frontend -   /api/user/reset:id/token
            //Send RESET Password Email
            let info = await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: "Login User Project",
                html: `<a href="${link}>Click Here</a> to Reset your Password`
            })
            res.send({"Status":"Success", "message": "Password Reset email sent... Please Check your Email", "info":info})
            } else{
                res.send({"Status":"Failed", "Message":"Email doesn't exist!"})
            }
        }else {
            res.send({"Status":"Failed", "Message":"Email field is required!"})
        }
    }

    static userPasswordReset = async(req, res) => {        //Works when we click on Reset submit button
        const {password, password_confirmation} = req.body  //req.body - gets data from body form
        const {id, token} = req.params      //params - gets id from url
        const user = await UserModel.findById(id)
        const new_secret = user._id + process.env.JWT_SECRET_KEY    //Generating new Secret 
        try{
            jwt.verify(token, new_secret)   //Verifying token with new_secret
            if(password && password_confirmation){  //Checking if Both are given
                if(password !== password_confirmation){
                    res.send({"Status":"Failed", "Message":"Passwords don't match!"})
                } else {
                    const salt = await bcrypt.genSalt(10) 
                    const newHashPassword = await bcrypt.hash(password, salt)  //Hashing password using salt
                    await UserModel.findByIdAndUpdate(user._id, { $set: { password: newHashPassword } })    //update new password in userModel 
                    res.send({"Status":"Success", "message": "Password Reset Successful!"})
                }
            } else {
                res.send({"Status":"Failed", "Message":"All fields are required!"})
            }
        } catch(error) {
            res.send({"Status":"Failed", "Message":"Invalid Token!"})
        }
    }    
}


export default UserController