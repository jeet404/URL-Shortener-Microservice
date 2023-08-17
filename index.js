// set up an express app
const port = 3000;

const express = require("express");
require("dotenv").config();
const dns = require("dns");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const cors = require("cors");

// set up an express app
const app = express();

// mount the body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
// render the stylesheet as found in the public folder
app.use(express.static(`${__dirname}/public`));

mongoose.connect(
  "mongodb+srv://communitycoder3:hKMASIoylKzHWZOO@cluster0.pn4wuwk.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
  }
);

const { Schema } = mongoose;
const urlSchema = new Schema({
  original_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: Number,
    required: true,
    default: 0,
  },
});

// define a model, on which all instances (documents) will be based
const Url = mongoose.model("Url", urlSchema);

// EXPRESS && ROUTING
// in the root path render the HTML file as found in the views folder
app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/views/index.html`);
});

app.post("/api/shorturl", async (req, res) => {
  try {
    const urlRequest = req.body.url;

    const hostname = urlRequest
      .replace(/http[s]?\:\/\//, "")
      .replace(/\/(.+)?/, "");

    const addresses = await new Promise((resolve, reject) => {
      dns.lookup(hostname, (lookupErr, addresses) => {
        if (lookupErr) {
          reject("lookup() error");
        }
        resolve(addresses);
      });
    });

    if (!addresses) {
      res.json({
        error: "invalid URL",
      });
    } else {
      const urlFound = await Url.findOne({
        original_url: urlRequest,
      });

      if (!urlFound) {
        const count = await Url.estimatedDocumentCount();

        const url = new Url({
          original_url: urlRequest,
          short_url: count + 1,
        });

        const urlSaved = await url.save();

        res.json({
          original_url: urlSaved.original_url,
          short_url: urlSaved.short_url,
        });
      } else {
        res.json({
          original_url: urlFound.original_url,
          short_url: urlFound.short_url,
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.send("An error occurred.");
  }
});

// following a get request in the selected path, re-route the visitor toward the unshortened url
app.get("/api/shorturl/:shorturl", async (req, res) => {
  try {
    const { shorturl } = req.params;

    const urlFound = await Url.findOne({
      short_url: shorturl,
    });

    if (!urlFound) {
      res.json({
        error: "no matching URL",
      });
    } else {
      res.redirect(urlFound.original_url);
    }
  } catch (error) {
    console.error(error);
    res.send("An error occurred.");
  }
});

// listen in the selected port and render the simple application
app.listen(port);
console.log(`listening on port ${port}`);
