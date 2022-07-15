import jwt from 'jsonwebtoken'
import UserModel from '../models/User.js'

var checkUserAuth = async(req, res, next) => {    //If the user has to access protected routes, then he must pass the token which was generated while logging in
    let token
    const {authorization} = req.headers  //headers consists of all headers that comes from the client
    if(authorization && authorization.startsWith('Bearer')){    //Check if anty val;ue is there in authorization and check if authorization starts with a Bearer 
        try{
            //Get Token from header
            token = authorization.split(' ')[1] //We split the Bearer Token on space and obtain the 2nd element i.e token
            
            
            //Verify Token
            const {userID} = jwt.verify(token, process.env.JWT_SECRET_KEY)  //verify token and JWT_SECRET_KEY

            //Get User from Token
            req.user = await UserModel.findById(userID).select('-password')   //Obtains everything except password and stored into req.user
            next()
        } catch(error) {
            res.status(401).send({"Status": "Failed!", "Message": "Unauthorized User!"})
        }
    }
    if(!token) {    //if token is not received
        res.status(401).send({"Status": "Failed!", "Message": "Unauthorized User, No Token!"})
    }
}

export default checkUserAuth

