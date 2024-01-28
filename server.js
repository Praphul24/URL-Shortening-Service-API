const express = require("express");
const { Client } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.port || 5000;

//middlewares
//app.use(express.static("public"));
app.use(cors());
app.use(express.json());

async function executeQuery(query, values) {
  const client = new Client(process.env.DATABASE_URL);

  try {
    await client.connect();
	console.log("Database Connected ");
    const results = await client.query(query, values);
    return results;
  } catch (err) {
    console.error("Error executing query:", err);
    throw err;
  } finally {
    await client.end();
  }
}

// default route
app.get("/", function (request, response) {
  //response.sendFile(__dirname + "backend/public/index.html");
  response.send("Shorten Your URL Service is Live...");
});

// creating the short url, logic here
app.post("/api/create-short-url", async function (request, response) {
  let uniqueID = Math.random().toString(36).replace(/[^a-z0-9]/gi, '').substring(2, 10);
  const sql = 'INSERT INTO links(longurl, shorturlid) VALUES($1, $2)';
  const values = [request.body.longurl, uniqueID];

  try {
    await executeQuery(sql, values);
    response.status(200).json({
      status: "ok",
      shorturlid: uniqueID
    });
  } catch (error) {
    response.status(500).json({
      status: "notok",
      message: "Something went wrong"
    });
  }
});

// getting all the short urls created
app.get("/api/get-all-short-urls", async function (request, response) {
  const sql = 'SELECT * FROM links';

  try {
    const result = await executeQuery(sql);
    response.status(200).json(result.rows);
  } catch (error) {
    response.status(500).json({
      status: "notok",
      message: "Something went wrong"
    });
  }
});

// creating link between long and shorturl
app.get("/:shorturlid", async function (request, response) {
  let shorturlid = request.params.shorturlid;
  const selectSql = 'SELECT * FROM links WHERE shorturlid=$1 LIMIT 1';
  const selectValues = [shorturlid];

  try {
    const result = await executeQuery(selectSql, selectValues);

    if (result.rows.length > 0) {
      const updateSql = 'UPDATE links SET count = count + 1 WHERE id=$1';
      const updateValues = [result.rows[0].id];
      await executeQuery(updateSql, updateValues);

      response.redirect(result.rows[0].longurl);
    } else {
      response.status(404).json({
        status: "notok",
        message: "Short URL not found"
      });
    }
  } catch (error) {
    response.status(500).json({
      status: "notok",
      message: "Something went wrong"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});


