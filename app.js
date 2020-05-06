const express = require("express");
const Multer = require("multer");
const { Storage } = require("@google-cloud/storage");

const app = express();

// firebase init
const storage = new Storage({
  projectId: "<firebase project id>",
  keyFilename: "<filename.json>",
});
const bucket = storage.bucket("<firebase storage bucket name>");

// multer
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

// upload image to storage function
const uploadImageToStorage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject("No image file");
    }
    let newFileName = `${file.originalname}_${Date.now()}`;

    let fileUpload = bucket.file(newFileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on("error", (error) => {
      reject(error);
    });

    blobStream.on("finish", () => {
      // The public URL can be used to directly access the file via HTTP.
      const url = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      resolve(url);
    });

    blobStream.end(file.buffer);
  });
};

// Routes
app.post("/upload", multer.single("file"), (req, res) => {
  let file = req.file;
  if (file) {
    uploadImageToStorage(file)
      .then((url) => {
        return res.status(200).send({
          image: url,
        });
      })
      .catch((error) => {
        return res.status(500).send({
          error: error,
        });
      });
  } else {
    return res.status(422).send({
      error: "file is required",
    });
  }
});

// PORT
const port = 3000;

// Starting a server
app.listen(port, () => {
  console.log(`app is running at ${port}`);
});
