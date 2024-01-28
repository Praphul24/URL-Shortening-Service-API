const express = require("express");
const mysql = require("mysql");
require('dotenv').config();


const app = express();
const PORT = process.env.port || 5000;
//console.log(process.env.port);

//middlewares
//app.use(express.static("public"));
app.use(express.json());

//connecting the database
// const con = mysql.createConnection({
// 	host:'localhost',
// 	user:'root',
// 	password:'dm125.working',
// 	database:'shorturls'
// });
const con = mysql.createConnection({
	host:process.env.dbhost,
	user:process.env.dbuser,
	password:process.env.dbpassword,
	database:process.env.dbname
});
con.connect(function(error){
	if(error){
		console.log("Database connection failed");
		throw error;
	}
	else{
		console.log("Database connected");
	}
})

//default route
app.get("/",function(request,response){
	//response.sendFile(__dirname + "/public/index.html");
	response.send("URL Shortening Service is Working!...")
});

//creating the short url, logic here
app.post("/api/create-short-url",function(request,response){
	let uniqueID = Math.random().toString(36).replace(/[^a-z0-9]/gi,'').substring(2,10);
	let sql = `INSERT INTO links(longurl,shorturlid) VALUES('${request.body.longurl}','${uniqueID}')`;
	con.query(sql,function(error,result){
		if(error){
			response.status(500).json({
				status:"notok",
				message:"Something went wrong"
			});
		} else {
			response.status(200).json({
				status:"ok",
				shorturlid:uniqueID
			});
		}		
	})
});

//getting all the short urls created
app.get("/api/get-all-short-urls",function(request,response){
	let sql = `SELECT * FROM links`;
	con.query(sql,function(error,result){
		if(error){
			response.status(500).json({
				status:"notok",
				message:"Something went wrong"
			});
		} else {
			response.status(200).json(result);
		}
	})
});

//creating link between long and shorturl
app.get("/:shorturlid",function(request,response){
	let shorturlid = request.params.shorturlid;
	let sql = `SELECT * FROM links WHERE shorturlid='${shorturlid}' LIMIT 1`;
	con.query(sql,function(error,result){
		if(error){
			response.status(500).json({
				status:"notok",
				message:"Something went wrong"
			});
		} else {
			sql = `UPDATE links SET count = '${result[0].count+1}' WHERE id='${result[0].id}' LIMIT 1`;
			con.query(sql,function(error,result2){
				if(error){
					response.status(500).json({
						status:"notok",
						message:"Something went wrong"
					});
				} else {
					response.redirect(result[0].longurl);
				}
			})
		}
	})
});

app.listen(PORT, ()=> {
	console.log(`Server is listening on PORT ${PORT}`);
});
