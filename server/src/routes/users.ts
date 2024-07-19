import { Router, Request, Response, response } from 'express';
import {  PrismaClient } from '@prisma/client';
import { boolean, number } from 'zod';
import { error } from 'console';
import checkUser from '../middlewares/checkUser';

const prisma = new PrismaClient()

const router = Router();

//generate user id
async function generateUserId() {
    const latestUser = await prisma.user.findFirst({
      orderBy: { user_id: 'desc' },
    });
  
    let newId;
    if (latestUser) {
      const latestIdNumber = parseInt(latestUser.user_id.slice(1));
      newId = `U${(latestIdNumber + 1).toString().padStart(6, '0')}`;
    } else {
      newId = 'U000001';
    }
  
    return newId;
  }

//get all users
router.get('/', async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();
        const userArray = [];
        for(let user of users) {
            userArray.push({
                id: user.user_id,
                name: user.user_name,
                phone: user.phone_no,
                email: user.mail
            });
        }
        res.json(userArray);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching users' });
    }
});

//create a new user
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, phone, email, password } = req.body;
        if(password.length < 8) {
            res.status(400).json({
                staus: "FAILED", 
                message: 'Password must be at least 8 characters'
        });
        return;
    }
        const user = await prisma.user.create({
            data: {
                user_id: await generateUserId(),
                user_name: name,
                mail: email,
                password:password,
                phone_no: phone
            }
        });
        res.status(201).json({
            id: user.user_id,
            name: user.user_name,
            phone: user.phone_no,
            email: user.mail
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while creating user' });
    }
});

//get user by id
router.get('/:userId', async(res: Response, req: Request) => {
    try{
        const userId = req.params.userId;
        const user = await prisma.user.findUnique({
            where: { user_id: userId }
        });
        if(!user){
            res.status(404).json({ status: 'NOT FOUND' });
            return;
        }
        res.json({
            staus: "SUCCESS",
            data:{
                id: user.user_id,
                name: user.user_name,
                phone: user.phone_no,
                email: user.mail
            }
        });
    } catch(err){
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching user' });
    }
});

//update user by id
router.patch('/:userId', async(req: Request, res: Response) =>{
    try{
         const { userName, email, phone } = req.body;
         const userId = req.params.userId;
         const getUser = await prisma.user.findUnique({
            where:{user_id: userId}
         })
         if(!getUser){
            res.status(404).json({ status: "FAILED", error: 'User not found'});
            return;
         }
         if(userName){
            await prisma.user.update({
                where: {user_id: userId},
                data:
                {
                    user_name: userName
                }
            });
         }
         if(email){
            const checkMail = await prisma.user.findUnique({ 
                where: {mail: email}
            });

            if(checkMail){
                res.status(400).json({status: "FAILED", message: "This email already linked to different a user"});
                return;
            }
            await prisma.user.update({
                where: {user_id: userId},
                data:
                {
                    mail: email
                }
            });
         }
         if(phone){
            const checkPhone = await prisma.user.findUnique({ 
                where: {phone_no: phone}
            });

            if(checkPhone){
                res.status(400).json({status: "FAILED", message: "This phone number already linked to different an user"});
                return;
            }
            await prisma.user.update({
                where: {user_id: userId},
                data:
                {
                    phone_no: phone
                }
            }); 
         }
         res.status(204).json({message: "Successfully updated user"});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: "An error occurred while updating user"});
    }
});

//delete an user
router.delete('/:userId', checkUser, async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const findUser = await prisma.user.findUnique({
            where: {
                user_id: userId
            },
        });
        if(!findUser){
            res.status(404).json({
                status: "FAILED",
                error: "User not found"
            });
        }
        await prisma.user.delete({
            where:{
                user_id: userId
            }
        });
        res.status(204).json({
            status: "SUCCESS",
            message: "Successfully deleted user"
        })
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            status: "INTERNAL SERVER ERROR",
            message: "Please try later!"
        })
    }
});

export default router;