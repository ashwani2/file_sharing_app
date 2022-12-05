require("dotenv").config()
const multer = require("multer")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const File = require("./models/File")
const fs=require("fs")

const { networkInterfaces } = require('os');

const nets = networkInterfaces();
const express = require("express")
const app = express()
app.use(express.urlencoded({ extended: true }))

const upload = multer({ dest: "uploads" })

mongoose.connect(process.env.DATABASE_URL)

app.set("view engine", "ejs")

app.get("/", (req, res) => {
  res.render("index")
})

app.post("/upload", upload.single("file"), async (req, res) => {
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
  }
  if (req.body.password != null && req.body.password !== "") {
    fileData.password = await bcrypt.hash(req.body.password, 10)
  }

  const file = await File.create(fileData)

  res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` })
})

app.route("/file/:id").get(handleDownload).post(handleDownload)

async function handleDownload(req, res) {
     let folder = './uploads/';

  const file = await File.findById(req.params.id)

  if (file.password != null) {
    if (req.body.password == null) {
      res.render("password")
      return
    }

    if (!(await bcrypt.compare(req.body.password, file.password))) {
      res.render("password", { error: true })
      return
    }
  }

  file.downloadCount++
  await file.save()
  console.log("The above uploaded file has been downloaded ",file.downloadCount,"times")

  res.download(file.path, file.originalName)

  var idAddress = req.socket.remoteAddress;
 
  let newAddress=idAddress.split("f:")
 
    fs.readdir(folder, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        console.log(file + ' : File Deleted Successfully.');
        let content=`${file} downloaded from! ${newAddress[1]}`
        content += "\n";
        fs.appendFile("logs.txt", content, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        }); 
        fs.unlinkSync(folder + file);
      }
    });
  
}


app.listen(process.env.PORT,()=>{
    console.log(`Server Started listening on port ${process.env.PORT} `)
})