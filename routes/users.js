const { response } = require("express");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../model/user");

router.get("/users", auth, async (req, res) => {
  const { query } = req;

  var page = parseInt(query.page) || 1; //for next page pass 1 here

  var perPage = parseInt(query.perPage) || 10;

  var filter = {};
  if (query.q) {
    filter = { first_name: { $regex: query.q, $options: "i" } };
  }

  var top = parseInt(query.top);
  if (!isNaN(top)) {
    perPage = top;
    page = 1;
  }
  filter.is_admin = false;
  const count = await User.find(filter).countDocuments();

  const data = await User.find(filter, null, {
    limit: perPage,
    skip: (page - 1) * perPage,
  });

  res.status(200).send({
    total: count,
    data,
    currentPage: page,
    perPage,
    totalPages: Math.ceil(count / perPage),
    hasNextPage: page < Math.ceil(count / page),
    hasPrevPage: page > 1,
  });
});

// router.post("/users", (req, res) => {
//   // create user
// });

// router.get("/users/:id", (req, res) => {
//   // get a user
// });

router.put("/users", auth, async (req, res) => {
  // update a user

  // const userID = req.params.id;
  const userID = req.user.user_id;
  const updateFields = { ...req.body };
  delete updateFields.password;
  delete updateFields.createdAt;
  delete updateFields.image;

  try {
    // if (req.files) {
    //   const profileImage = req.files.profile;
    //   const profileImageName = userID + "." + profileImage.name.split(".")[1];
    //   const uploadPath = process.cwd() + "/images/" + profileImageName;
    //   req.body.image = "/profiles/" + profileImageName;
    //   profileImage.mv(uploadPath, function (err) {
    //     if (err) return res.status(500).send(err);
    //   });
    // }
    const updatedUser = await User.findByIdAndUpdate(userID, updateFields, {
      new: true,
    });
    delete updatedUser.password;
    res.status(202).send({
      status: true,
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.put("/test", async (req, res) => {
  const sampleFile = req.files.sampleFile;
  const uploadPath =
    process.cwd() + "/images/" + "userID" + "." + sampleFile.name.split(".")[1];
  sampleFile.mv(uploadPath, function (err) {
    if (err) return res.status(500).send(err);
    res.send(sampleFile.name.split(".")[1]);
  });
});

router.put("/profile-image", auth, async (req, res) => {
  try {
    if (req.files) {
      const userID = req.user.user_id;
      const profileImage = req.files.profile;
      const profileImageName = userID + "." + profileImage.name.split(".")[1];
      const uploadPath = process.cwd() + "/images/" + profileImageName;
      req.body.image = "/profiles/" + profileImageName;
      profileImage.mv(uploadPath, function (err) {
        if (err) return res.status(500).send(err);
      });
      const updatedUser = await User.findByIdAndUpdate(
        userID,
        { image: req.body.image },
        {
          new: true,
        }
      );
      res.status(202).json({
        staus: true,
        message: "File uploaded successfully",
        image: req.body.image,
      });
    } else {
      res.status(200).json({
        staus: false,
        message: "Request does not contain a file",
      });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/user/:id?", auth, async (req, res) => {
  const userId = req.params.id || req.user.user_id;
  const user = await User.findById(userId);
  delete user.password;
  res.json(user);
});

// router.delete("/users/:id", (req, res) => {
//   // delete user
// });

// router.get("/users", (req, res) => {
//   // all users with maybe pagination
// });

module.exports = router;

// POST -> CREATE
// GET -> RETERIVE RECORD
// PUT/PATCH -> UPDATE
// PUT -> MULTIPLE UPDATE
// PATCH -> PATCH A SINGLE FIELD
// DELETE -> DELETE