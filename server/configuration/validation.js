const Joi = require('joi');

let joiValidation = function (reqData, schema) {

    const auctionSchema = Joi.object().keys({
        auctioned: Joi.boolean().required(),
        endTime: Joi.number().required(),
        image: Joi.string().required(),
        itemDesc: Joi.string().required(),
        itemName: Joi.string().required(),
        startAmount: Joi.string().required(),
        startTime: Joi.number().required(),
        itemId : Joi.string().required()
    });

    const userSchema = Joi.object().keys({
        email : Joi.string().email().required(),
        name: Joi.string().required(),
        password: Joi.string().required(),
    });

    const loginSchema = Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });

    const bidSchema = Joi.object().keys({
        bidId: Joi.string().required(),
        epoch : Joi.number().required(),
        user: Joi.string().email().required(),
        amount : Joi.string().required(),
        itemId : Joi.string().required(),
    });


    switch (schema) {
        case "auctionSchema":
            schema = auctionSchema;
            break;
        case "userSchema":
            schema = userSchema;
            break;
        case "loginSchema":
            schema = loginSchema;
            break;
        case "bidSchema":
            schema = bidSchema;
            break;
        default:
            break;
    }

    let result = Joi.validate(reqData, schema);
    return result.error;

}

module.exports = {
    joiValidation,
};