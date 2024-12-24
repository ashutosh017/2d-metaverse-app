import { NextFunction, Request, Response } from "express";

import jwt from 'jsonwebtoken'
import { jwt_secret } from "../config";

export const userMiddleware = async(req:Request,res:Response,next:NextFunction)=>{
    const headers = req.headers["authorization"]
    const token = headers?.split(" ")[1]
    console.log(req.route.path);
    console.log(token);
    if(!token){
        res.status(403).json({
            msg:"unauthorized"
        })
        return;
    }
    try {
        const decoded = jwt.verify(token,jwt_secret) as {userId:string,role:string};
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({
            msg:"unauthorized"

        })        
    }

}