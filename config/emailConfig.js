import dotenv from 'dotenv'
dotenv.config()
import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({  //Creates a transport    
        host:process.env.EMAIL_HOST,
        PORT:process.env.EMAIL_PORT,
        secure:false,    //true for465, flase for other ports
        auth: {
            user: process.env.EMAIL_USER,   //Admin Gmail ID
            pass: process.env.EMAIL_PASS,   //Admin Gmail Password
        },
})

export default transporter