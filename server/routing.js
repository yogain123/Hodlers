const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const moment = require('moment');
const multer = require('multer');
const _ = require('lodash');
const multipartUpload = multer().any();
var schedule = require('node-schedule');
const {
  deleteSession,
  getUser,
  createUser,
  createSession,
  createBid,
  getAllItem,
  authorization,
  getItemByItemId,
  getBidUsingItemId,
  getBidUsingEmailId,
  sendEmail,
  updateAuctionItemWhichIsSold,
  createAuction,
  uploadImage
} = require("./controller");
const {
  joiValidation
} = require('./configuration/validation');

const {
  getToken
} = require("./configuration/local");

router.get("/", function (req, res, next) {
  res.sendFile(`${__dirname}/public/index.html`);
})

router.post("/create/auction", multipartUpload, async function (req, res, next) {
  try {

    /**
     * All field validation
     * if validation failed , throw error, else
     * create Item auction,
     * throw error if something else goes wrong
     */

    /**
     * Upload Image(Auction Item) To AWS S3 Bucket
     * pass the returned key url in reqData to save the s3 url Key => The same can be done eaily from frontend 
     * without involving backend server
     * for processing heavy images directly from frontend : My Medium Publication on the same ==>
     * https://medium.com/@yogendrasaxena56/upload-image-directly-from-react-app-to-amazon-s3-856280c62e45
     */

    //uploading item->image to amazon s3
    let s3key = await uploadImage(req.files[0].buffer);
    let reqData = JSON.parse(req.body.auctionData);
    reqData.image = s3key;
    reqData.itemId = String(new Date().getTime());
    reqData.auctioned = false;

    let error = joiValidation(reqData, "auctionSchema")
    if (error) {
      return res.send({
        status: false,
        info: error && error.message
      });
    }

    await createAuction(reqData);
    res.send({
      status: true,
      info: "successfully added item for Auction"
    });
  } catch (error) {
    res.send(error);
  }
})

router.post("/create/user", async function (req, res, next) {
  try {

    /**
     * ALl Field validation ,throw
     * error if validaton fails , else
     * Create User
     * throw error if something else goes wrong
     */

    let reqData = req.body;

    let error = joiValidation(reqData, "userSchema")
    if (error) {
      return res.send({
        status: false,
        info: error && error.message
      });
    }

    let userDetails = await getUser(reqData.email);
    if (userDetails) {
      throw {
        status: "false",
        info: "User Already Present"
      };
    }

    reqData.password = bcrypt.hashSync(reqData.password);

    await createUser(reqData);
    res.send({
      status: "true",
      info: "User Successfully Created"
    });
  } catch (error) {
    res.send(error);
  }
})

router.post("/login", async function (req, res, next) {
  /**
   * Check Password ,if failed then
   * throw Error with info "User not Created or Password Incorrect" , else
   * Login User and send a jwt token in resposne => to be used in other routes as an authentication
   * throw error if anything else goes wrong
   * Note : This JWT token will have email id of the user as part of payload
   */
  try {
    let reqData = req.body;

    let error = joiValidation(reqData, "loginSchema")
    if (error) {
      return res.send({
        status: false,
        info: error && error.message
      });
    }

    let userDetails = await getUser(reqData.email);
    if (!userDetails)
      throw {
        status: "false",
        info: "User Not Created"
      }

    let checkPasswordValidation = bcrypt.compareSync(reqData.password, userDetails.password);
    if (!checkPasswordValidation)
      throw {
        status: "false",
        info: "Password is incorrect"
      }

    let token = getToken(reqData.email);
    await createSession({
      sessionId: token,
      email: reqData.email
    });

    res.send({
      status: "true",
      info: "Successfully Loged In",
      token
    });

  } catch (error) {
    res.send(error);
  }
})

router.post("/submit/bid", authorization, async function (req, res, next) {
  try {

    /**
     * All Field Vaidation (throw Error if validation fails), else
     * submit Bit
     * throw error if anything else goes wrong
     */

    let reqData = req.body;
    reqData.epoch = new Date().getTime();
    reqData.bidId = uuid();
    reqData.user = reqData.email;
    delete reqData.email;

    let error = joiValidation(reqData, "bidSchema")
    if (error) {
      throw ({
        status: false,
        info: error && error.message
      });
    }

    //Restrict bid for unknow itemId
    let item = await getItemByItemId(reqData.itemId)
    if (!item)
      throw ({
        status: false,
        info: `No Item with item Id : ${reqData.itemId} exist for Auction`
      })

    await createBid(reqData);

    res.send({
      status: true,
      info: "Bid Submitted Successfully"
    });
  } catch (error) {
    res.send(error);
  }
})


router.get("/view/bid", authorization, async function (req, res, next) {
  try {
    let reqData = req.body;

    /**
     * send all bid in response,
     * throw error if something goes wrong
     */

    let bids = await getBidUsingEmailId(reqData.email);

    res.send({
      status: true,
      response: bids
    });
  } catch (error) {
    res.send(error);
  }
})

router.get("/fetch/all/item", async function (req, res, next) {
  try {
    /**
     * send all item in response
     * throw error if something goes wrong
     */
    let allItems = await getAllItem();
    allItems = allItems.map(item => {
      item.startTime = moment(item.startTime).format('MMMM Do YYYY, h:mm:ss a');
      item.endTime = moment(item.endTime).format('MMMM Do YYYY, h:mm:ss a');
      return item;
    })
    res.send({
      status: true,
      info: `All Items in for Auctions are:`,
      response: allItems
    });
  } catch (error) {
    res.send(error);
  }
})

router.get("/fetch/item/:itemId", async function (req, res, next) {
  try {

    /**
     * send item in response which has item id as :itemId
     * throw error if something goes wrong
     */

    let itemId = req.params.itemId;
    let item = await getItemByItemId(itemId);
    if (!item)
      throw ({
        status: false,
        info: `No Item with item Id : ${itemId} exist for Auction`
      })
    if (item.auctioned) {
      //get uses details of this item with last highest bid id
      let userDetails = await getUser(item.wonBy);
      item.userDetails = userDetails;
    } else {
      //get bidding details using item id
      let bidDetails = await getBidUsingItemId(itemId);
      let bidAmount = bidDetails.map(item => +item.amount);
      let maxBidAmount = Math.max(...bidAmount);
      let highestBidDetails = bidDetails.find(item => item.amount == maxBidAmount);
      item.highestBidDetails = highestBidDetails;
    }

    res.send({
      status: true,
      info: `All Items for Auctions are:`,
      response: item
    });
  } catch (error) {
    res.send(error);
  }
})


router.delete("/logout", authorization, async function (req, res, next) {
  try {
    /**
     * Logging Out the logged In User==> Loged In User email is extracted by decoding passed token
     * throw error if anything else goes wrong
     */
    let reqData = req.body;
    await deleteSession(reqData.email);
    res.send({
      status: true,
      info: `${reqData.email} logged out successfully`
    });
  } catch (error) {
    res.send(error);
  }
})


schedule.scheduleJob('* * * * *', function () {
  /**
   * This is a cron job to check the winner
   * when any item reaches its end time.
   * it finds winner details and send email to all the bidder
   * of this item with winner and bid amount details
   * This cron job will run every 1 minute , every day
   */
  autoTaskExecutor();
});


async function autoTaskExecutor() {
  console.log("inside auto executor");
  try {
    let allAuctionItem = await getAllItem();
    for (let item of allAuctionItem) {
      //item.endTime = 1549047044000
      let diff = moment(item.endTime).diff(moment(), "hours");
      if (diff < 0) {
        /**
         * this item has reached end time,
         * find winner of that item => get highest bid for this item
         * send email to all bidder of this item with winner details
         * Note : Email I'm sending plain JS object , without any css and html as of now
         */

        let bidDetails = await getBidUsingItemId(item.itemId);
        if(_.isEmpty(bidDetails))
          continue;
        let bidAmount = bidDetails.map(item => +item.amount);
        let maxBidAmount = Math.max(...bidAmount);
        let highestBidDetails = bidDetails.find(item => item.amount == maxBidAmount);
        item.highestBidDetails = highestBidDetails;
        let itemDetailFromAuction = await getItemByItemId(item.highestBidDetails.itemId);
        //winner detail is item.highestBidDetails
        item.userDetails = await getUser(item.highestBidDetails.user);
        //send email to all users in bidDetails with item details
        for (let eachUser of bidDetails) {
          //send email to eachUser.user with winner : item details
          if (!itemDetailFromAuction.auctioned)
            await sendEmail(eachUser.user, item);
        }
        await updateAuctionItemWhichIsSold(itemDetailFromAuction.itemId, item.highestBidDetails.user);
      }

    }
  } catch (error) {

  }
}


module.exports = router;