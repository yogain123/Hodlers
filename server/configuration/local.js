var jwt = require('jsonwebtoken');

module.exports = {
  sendGridApiKey:"dummyValue",
  secret:"hodlers",
  accessKeyId: "dummyValue",
  secretAccessKey : "dummyValue",
  getToken(email){
    let token = jwt.sign({
      email,
    }, "hodlers");
    return token;
  },
};