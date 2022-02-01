const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');//deprecated
const gravatar  = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../../models/User');

//@route   POST api/users
//@desc    Registering Users
//@access  Public
router.post('/',[
    check('name', 'Name is Required').not().isEmpty(),
    check('email', 'Email needs to be provided in a valid format').isEmail(),
    check('password', 'Password is required and should be atleast 8 in length').isLength({min: 6})
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {name, email, password} = req.body;

    try{
        let user = await User.findOne({email});

        if(user){
            return  res.status(400).json({errors: [{msg: 'User already exists'}]}); 
        }

        const avatar = gravatar.url(email,{
            s: 200,
            r: 'pg',
            d: 'mm'

        })

        user = new User({
            name,
            email,
            password,
            avatar
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get('jwttoken'),
            {expiresIn: 360000},
            (err, token) => {
                if(err) throw err;
                res.json({ token });
            }
        );

    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;