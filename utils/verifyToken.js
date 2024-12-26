const verifyToken = (req, res, next)=>{
    const token = req.headers.authorization.split(' ')[1];
    if(token){
        next()
    }else{
        res.status(401).json({message: 'Forbidden Access'})
    }
}
module.exports = verifyToken;