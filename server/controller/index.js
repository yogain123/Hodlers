var AWS = require('aws-sdk');
var region = "ap-south-1";
const jwt = require('jsonwebtoken');
var {
    accessKeyId,
    secretAccessKey,
    secret,
    sendGridApiKey
} = require("../configuration/local");

var sg = require('sendgrid')(sendGridApiKey);
const pug = require("pug");

var EmailTemplate = require('email-templates').EmailTemplate;

let configObjAWS = {
    region: region,
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
};

var dynamoDB = new AWS.DynamoDB.DocumentClient(configObjAWS);
AWS.config.update(configObjAWS);
var s3 = new AWS.S3();

exports.uploadImage = async (data)=>{

    try{

    let Key = String(new Date().getTime())+".jpg";

    var params = {
        Body: data, 
        Bucket: "bankofhodlers", 
        Key
       }

       await s3.putObject(params).promise();
       return Key;
       
    }
    catch(error){
        throw {
            status: false,
            message: "Something went Wrong"
        }
    }

}


exports.deleteSession = async (email) => {
    try {
        var params = {
            TableName: "BANK_SESSION",
            Key: {
                email
            }
        };
        await dynamoDB.delete(params).promise();
    } catch (error) {
        throw {
            status: false,
            message: "Something went Wrong"
        }
    }
}

exports.getUser = async (email) => {

    try {
        let params = {
            KeyConditionExpression: "#email = :email",
            ExpressionAttributeNames: {
                "#email": "email",
            },
            ExpressionAttributeValues: {
                ":email": email
            },
            TableName: "BANK_USERS"
        };
        let data = await dynamoDB.query(params).promise();
        return data.Items[0];
    } catch (error) {
        throw {
            status: false,
            message: "Something went Wrong"
        }
    }
}

exports.createUser = async (reqData) => {
    try {
        let params = {
            Item: reqData,
            ReturnConsumedCapacity: "TOTAL",
            TableName: "BANK_USERS",
        };
        await dynamoDB.put(params).promise();
        return;
    } catch (error) {
        throw {
            status: false,
            message: "Something went Wrong"
        }
    }
}

exports.createAuction = async (reqData) => {
    try {
        let params = {
            Item: reqData,
            ReturnConsumedCapacity: "TOTAL",
            TableName: "BANK_AUCTION",
        };
        await dynamoDB.put(params).promise();
        return;
    } catch (error) {
        throw {
            status: false,
            message: "Something went Wrong"
        }
    }
}

exports.createSession = async (reqData) => {
    try {
        let params = {
            Item: reqData,
            ReturnConsumedCapacity: "TOTAL",
            TableName: "BANK_SESSION",
        };
        await dynamoDB.put(params).promise();
        return;
    } catch (error) {
        throw {
            status: false,
            message: "Something went Wrong"
        }
    }
}

exports.getItemByItemId = async (itemId) => {
    try {
        let params = {
            KeyConditionExpression: "#itemId = :itemId",
            ExpressionAttributeNames: {
                "#itemId": "itemId",
            },
            ExpressionAttributeValues: {
                ":itemId": itemId
            },
            TableName: "BANK_AUCTION"
        };
        let data = await dynamoDB.query(params).promise();
        return data.Items[0];
    } catch (error) {
        throw {
            status: false,
            message: "Something went Wrong"
        }
    }
}

exports.updateAuctionItemWhichIsSold = async function (itemId, email) {
    
    let item = await exports.getItemByItemId(itemId);
    item.auctioned = true;
    item.wonBy = email;
    let params = {
        Item: item,
        ReturnConsumedCapacity: "TOTAL",
        TableName: "BANK_AUCTION",
    };
    await dynamoDB.put(params).promise();

}

exports.getBidUsingItemId = async (itemId) => {
    try {
        var conditionExpression = "#itemId = :itemId";
        var attributeName = {
            "#itemId": "itemId"
        };

        var attributeVal = {
            ":itemId": itemId
        };
        let params = {
            KeyConditionExpression: conditionExpression,
            ExpressionAttributeNames: attributeName,
            ExpressionAttributeValues: attributeVal,
            TableName: "BANK_BID",
            IndexName: "itemId-index",
        };

        let data = await dynamoDB.query(params).promise();
        return data.Items;
    } catch (error) {
        throw {
            status: false,
            message: "Something went Wrong"
        }
    }
}

exports.getBidUsingEmailId = async (user) => {
    try {
        var conditionExpression = "#user = :user";
        var attributeName = {
            "#user": "user"
        };

        var attributeVal = {
            ":user": user
        };
        let params = {
            KeyConditionExpression: conditionExpression,
            ExpressionAttributeNames: attributeName,
            ExpressionAttributeValues: attributeVal,
            TableName: "BANK_BID",
            IndexName: "user-index",
        };

        let data = await dynamoDB.query(params).promise();
        return data.Items;
    } catch (error) {
        throw {
            status: false,
            message: "Something went Wrong"
        }
    }
}

exports.getAllItem = async () => {
    try {
        let params = {
            ReturnConsumedCapacity: "TOTAL",
            TableName: "BANK_AUCTION",
        };
        let allItems = await dynamoDB.scan(params).promise();
        return allItems.Items;
    } catch (error) {
        throw {
            status: false,
            message: "Something went Wrong"
        }
    }

}

exports.createBid = async (reqData) => {
    try {
        let params = {
            Item: reqData,
            ReturnConsumedCapacity: "TOTAL",
            TableName: "BANK_BID",
        };
        dynamoDB.put(params).promise();
        return;
    } catch (error) {
        throw {
            status: false,
            message: "Something went Wrong"
        }
    }
}

exports.authorization = async (req, res, next) => {

    try {
        let decoded = jwt.verify(req.headers.apikey, secret);
        email = decoded.email
        let params = {
            KeyConditionExpression: "#email = :email",
            ExpressionAttributeNames: {
                "#email": "email",
            },
            ExpressionAttributeValues: {
                ":email": email
            },
            TableName: "BANK_SESSION"
        };
        let data = await dynamoDB.query(params).promise();
        if (data.Items[0] && data.Items[0].sessionId == req.headers.apikey) {
            Object.assign(req.body, {
                email
            })
            next();
        } else
            throw {}
    } catch (error) {
        res.send({
            status: "false",
            info: "Invalid Token or You might be logged out"
        });
    }
}

exports.sendEmail = async (email, data) => {
    return new Promise(async (resolve, reject) => {
        try{
        const html = pug.renderFile(`${__dirname}/../public/email.pug`,{data});
        var subject = "Winner Details";
        var request = sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: {
                personalizations: [{
                    to: [{
                        email
                    }],
                    subject
                }],
                from: {
                    email: "yogendrasaxena56@gmail.com"
                },
                content: [{
                    type: 'text/html',
                    value: html
                }]
            }
        });

        sg.API(request, function (error, response) {
            if (error)
                resolve({
                    status: false,
                    message: "Failed"
                })
            else
                resolve({
                    status: true,
                    message: "Success"
                });
        });
    }
    catch(error){
        console.log("Error is "+error);   
    }
    });
}