const { Router } = require("express");
const User = require("../model/user");
const JWT = require("jsonwebtoken");
const inspection = require("../model/inspection");


const message = (mssg, data = null, status = false) => {
  return { message: mssg, status: status, data: data };
};

const appRouter = Router();

appRouter.post("/login", async (req, res) => {
  const login = req.body?.login;
  if (!login) return res.status(400).json(message("Provide Login"));

  try {
    const user = await User.findOne({ id: login });
    if (!user) return res.status(404).json(message("Invalid Login"));
    const token = JWT.sign({ id: user?.id, _id: user?._id }, "NOSECRET");
    return res.json(message("LoggedIn", { token: token, user: user }, true));
  } catch (err) {
    return res.status(400).json(message("Error Occured"));
  }
});

appRouter.post("/inspect", async (req, res) => {
  try {
    const email = req.body?.email;
    const result = req.body.result;
    const name = req.body.name;

    if (!email || !result || !name)
      return res
        .status(400)
        .json(message("Payload Validation error", req.body));

    const save = await inspection.create({
      name: name,
      email: email,
      results: result,
    });
    return res.json(message("Saved", save, true));
  } catch (error) {
    return res.status(400).json(message("Error Occured"));
  }
});

appRouter.post("/generate", (req, res) => {});

module.exports = appRouter;
