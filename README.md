Project
--
Bank Of Hodlers

Stack Used
---

- NodeJS
- DynamoDB (Database)
- SendGrid (Sending Emails)
- node-schedule (Running Cron Job)
- AWS S3 Bucket (To Store Image)

API's Details
------------
URL : https://bank-of-hodlers.herokuapp.com/create/auction  <br/>
Method : POST  <br/>
payload :  form-data => because it contains item image also <br/>
1st param is a file <br/>
2nd param is
```
auctionData : 
{
  "endTime": 1549055317000,
  "itemDesc": "This is a super bus",
  "itemName": "bus",
  "startAmount": "45000",
  "startTime": 1556719117000
}
```
Note: auctionData's above all fields are mandatory. <br/>
Need to put start-time and end-time in form of EPOCH 13 digit => https://www.epochconverter.com/ <br/>
Functionality : It submit item for Auction, Contains all Fields Validation.  <br/>

----
----
URL : https://bank-of-hodlers.herokuapp.com/create/user   <br/>
Method : POST   <br/>
payload:
```
{
	"email":"yogendra.saxena@incred.com",
	"name":"yogendra incred",
	"password":"12345611"
}
```
Functionality : It create authenticated user who can do bidding for items , Contains all Fields Validation.   <br/>


----
----
URL : https://bank-of-hodlers.herokuapp.com/login    <br/>
Method : POST    <br/>
payload:
```
{
	"email":"yogendra.saxena@incred.com",
	"password":"12345611"
}
```

Functionality : User can login so that he/she can do bidding . Contains All Fields Validation<br/>
In Response, JWT_TOKEN will be received for that user which can be used in other route if that user wants <br/>
to perform any actions , like checking his/her all bids <br/>
Resposne : 
```
{
    "status": "true",
    "info": "Successfully Loged In",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InlvZ2VuZHJhLnNheGVuYUBpbmNyZWQuY29tIiwiaWF0IjoxNTU2ODEwNTkwfQ.wwWXpCgxp6oa9Z75iDpwd-Wq_D018qqBIRf8amyz4W4"
}
```

------
------
URL : https://bank-of-hodlers.herokuapp.com/submit/bid    <br/>
Method : POST   <br/>
**Header :** 
apiKey : JWT_TOKEN_OF_LOGEDIN_USER    <br/>
payload : 
```
{
	"amount":"75000",
	"itemId":"1556805300070"
}
```
Functionality : Logged In user can submit bid for item with passed itemId in payload, Contains All Field Validation   <br/>

------
------

URL : https://bank-of-hodlers.herokuapp.com/view/bid   <br/>
Method : GET  <br/>
**Header :** 
apiKey : JWT_TOKEN_OF_LOGEDIN_USER   <br/>
Functionality : Get All bid details of the Logged In User   <br/>

-------
------

URL : https://bank-of-hodlers.herokuapp.com/fetch/all/item   <br/>
Method : GET   <br/>
Functionality :  Get ALL item in Auction <br/>

-------
-------

URL : https://bank-of-hodlers.herokuapp.com/fetch/item/:itemId <br/>
example : https://bank-of-hodlers.herokuapp.com/fetch/item/1556801886187 <br/>
Method : GET <br/>
Functionality : Full Item details for the passed itemId<br/>
If the item is already auctioned it gives the details of buyer and the amount </br>
If the item is currently in auction, it list the highest bid amount

-----
-----


URL : https://bank-of-hodlers.herokuapp.com/logout   <br/>
Method : DELETE   <br/>
**Header :** 
apiKey : JWT_TOKEN_OF_LOGEDIN_USER   <br/>
Functionality :  Log out the LogedIn User

----
----

Runing a task to automatically finding the winner of each auction when it hits the endTime.  <br/>
Sending an email to all users who bid for the item with details of the winner and final <br/>
amount.<br/>

Author
------
Yogendra Saxena
