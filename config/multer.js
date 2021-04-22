var multer = require("multer");
var GridFsStorage = require("multer-gridfs-storage");
// var { GridFsBucket, ObjectId } = require("mongodb");
var storage = new GridFsStorage({
  url: process.env.MONGO_URL,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = req.body.fileName + path.extname(file.originalname);
      const fileInfo = {
        filename: filename,
        bucketName: "contents",
      };
      resolve(fileInfo);
    });
  },
});
var form_data = multer({ storage: storage });

exports = storage;
exports = form_data;
