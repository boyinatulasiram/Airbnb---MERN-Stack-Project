const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js")
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const  ExpressError = require("./utils/ExpressError.js");
const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

main().then(() => {
    console.log("Connected to DB");
}).
    catch((err) => {
        console.log(err);
    })

async function main() {
    await mongoose.connect(MONGO_URL);

}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (req, res) => {
    res.send("I am Root");
});

//Index Route
app.get("/listing", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listing/index.ejs", { allListings });
});

//create Route
app.get("/listing/new", (req, res) => {
    res.render("listing/new.ejs");
})

//show Route
app.get("/listing/:id", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listing/show.ejs", { listing });

})

//create pos route
app.post("/listing", wrapAsync(async (req, res,next) => {

     const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listing");
})
);

//edit rout
app.get("/listing/:id/edit", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listing/edit.ejs", { listing });
});

//update route
app.put("/listing/:id", async (req, res) => {
    let { id } = req.params;
    const { imageUrl, ...otherData } = req.body.listing;
    
    // Get the current listing to preserve filename if it exists
    const currentListing = await Listing.findById(id);
    const currentFilename = currentListing.image && currentListing.image.filename ? currentListing.image.filename : 'listingimage';
    
    const updateData = {
        ...otherData,
        image: {
            filename: currentFilename,
            url: imageUrl
        }
    };
    await Listing.findByIdAndUpdate(id, updateData);
    res.redirect(`/listing/${id}`);
})

//destroy route
app.delete("/listing/:id", async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listing");
})
// app.get("/testlisting",async (req,res) =>{
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Clanguate, Goa",
//         country: "India",
//     });
//     await sampleListing.save();
//     console.log("sample was savde");
//     res.send("succesful testing");
// })

//error hadnling middleware
app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});
app.use((err, req, res, next) => {
    let {statusCode,message} = err;
    res.status(statusCode).send(message);
})

app.listen(5000, () => {
    console.log("seerver listening to port 5000");
});