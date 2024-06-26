const { Router } = require("express");
const User = require("../model/user");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const inspection = require("../model/inspection");


const message = (mssg, data = null, status = false) => {
  return { message: mssg, status: status, data: data };
};

const secretKey = "NOSECRET";

const appRouter = Router();

const protected = async (req, res, next) => {
  try{
    const { authorization } = req.headers;
    if (!authorization) 
      return res.status(401).json(message("No token provided."));
  
    let token;
    if (authorization.startsWith("Bearer ")) {
      [, token] = authorization.split(" ");
    } else {
      token = authorization;
    }
  
    JWT.verify(token, secretKey, async (err, decoded) => {
      req.id = decoded?._id;
      req.role = decoded?.role;
      if (err) {
        if (err.name == "TokenExpiredError") {
          return next(message("Token expired!!!"));
        }
        else {
          return next(message("Invalid token. Authorization failed!"));
        }
      };
      return next()
    })
    
  }catch(e) {
    return res.status(400).json(message(e?.message, e))
  }
} 
const adminAccess = async (req, res, next) => {
  const role = req.role;
  if(role === "admin") return next()
    return res.status(401).json(message("Access denied"));
} 
const agentAccess = async (req, res, next) => {
  const role = req.role;
  if(role === "agent") return next()
    return res.status(401).json(message("Access denied"));
} 

appRouter.post('/agent', protected, adminAccess, async (req, res) => {
  let error = {};
  const branchName = req.body?.branchName;
  const email = req.body?.email;
  const agentPassword = req.body?.agentPassword;

  try{
    if(!branchName || branchName === '') error['branchName'] = "BranchName is required"
    if(!agentPassword || agentPassword === '') error['agentPassword'] = "agentPassword is required";
    if(!email || email === '') error['email'] = "email is required";
  
    const hasError = Object.keys(error).length > 0;
  
    if(hasError) return res.status(400).json(message("Fields cannot be empty", error))
  
  
    const branchID = 'TRP-'+branchName.toLowerCase().replace(' ', '-').replace(/\d/, '');
    const password = bcrypt.hashSync(agentPassword, 10)
  
    const data = await (new User({
      id: branchID,
      branch: branchName,
      email: email,
      password: password
    })).save()
    const {password:pwd, ...others} = data?._doc
    return res.status(200).json(message("Agent Created", others));
  }catch(e){
    return res.status(400).json(message(e.message, e))
  }



})

appRouter.post("/login", async (req, res) => {
  const login = req.body?.login;
  const password = req.body?.password;
  if (!login) return res.status(400).json(message("Provide Login Email and Password"));

  try {
    const user = await User.findOne({ email: login });
    if (!user) return res.status(404).json(message("Invalid Credentials"));

    const compared = await bcrypt.compare(password, user.password)
    if(!compared) return res.status(401).json(message("Invalid Credentials"));

    const token = JWT.sign({ id: user?.id, _id: user?._id, role: user?.role }, secretKey);
    const {password:pwd, ...others} = user?._doc
    return res.json(message("LoggedIn", { token: token, user: others }, true));
  } catch (err) {
    return res.status(400).json(message("Error Occured", err));
  }
});

appRouter.get("/agents", protected, adminAccess, async (req, res) =>  {
  const agents = await User.find({role: "agent"}).select("-password");
  return res.status(200).json(message("All Agents", agents, true))
})

appRouter.put("/agent/:id", protected, adminAccess, async (req, res) =>  {
  try{
    const agentID = req.params.id
    const branchName = req.body?.branchName;
    const password = req.body?.password;
    const email = req.body?.email;
  
    const agent = await User.findOne({_id: agentID})
    if(!agent) return res.status(400).json(message("Invalid Agent", agent))
      if(email) agent.email = email;
      if(password) agent.password = bcrypt.hashSync(password, 10);
      if(branchName) agent.branch = branchName;
      await agent.save()
    return res.status(200).json(message("Updated",null, true))
  }catch(err) {
    return res.status(400).json(message(err?.message));
  }
})

appRouter.delete("/agent/:id", protected, adminAccess, async (req, res) => {
  try{
    const agent = req.params.id;
    await User.deleteOne({_id: agent})
    return res.sendStatus(204)
  }catch(err) {
    return res.status(400).json(message(err?.message, err))
  }
})

appRouter.get("/agent/inspections/:id", protected, adminAccess, async (req, res) => {
  const agentID = req.params.id;
  const documents = await inspection.find({branchId: agentID})
  return res.status(200).json(message("Documents", documents, true))
})

appRouter.post("/inspection", protected, agentAccess, async (req, res) => {
  try {
    const result = req.body.result;
    const branch = req.id

    if (!result)
      return res
        .status(400)
        .json(message("result field is required", req.body));

    const save = await inspection.create({
      branchId: branch,
      results: result,
    });
    return res.json(message("Saved", save, true));
  } catch (error) {
    return res.status(400).json(message("Error Occured"));
  }
});

appRouter.post("/admin", async(req, res) => {
  const error = [];
  const email = req.body?.email;
  const password = req.body?.password;

  try{
    if(!password || password === '') error['password'] = "password is required";
    if(!email || email === '') error['email'] = "email is required";

    const hasError = Object.keys(error).length > 0;
  
    if(hasError) return res.status(400).json(message("Fields cannot be empty", error))
  
    const encrypted = bcrypt.hashSync(password, 10)
  
    const data = await (new User({
      email: email,
      password: encrypted,
      role: "admin"
    })).save()
    const {_id, role, ...others} = data;
    return res.status(200).json(message("Admin Created", {_id, role}));
  }catch(e){
    return res.status(400).json(message(e?.message, e))
  }
});

appRouter.get("/admins", protected, adminAccess, async(req, res) => {
  try{
    const admin = await User.findOne({role: 'admin'}).select("-password")
    return res.status(200).json(message("Admins", admin));
  }catch(e){
    return res.status(400).json(message(e?.message, e))
  }
});

appRouter.get("/dashboard", async(req, res) => {
  try{
    const admin = await User.find().select("-password")
    const totalAdmin = admin.filter(x => x.role === "admin").length
    const totalAgent = admin.filter(x => x.role === "agent").length

    const totalDoc = await inspection.countDocuments();
    return res.status(200).json(message("Dashboard", {
      totalAdmin: totalAdmin, totalAgent: totalAgent, totalDoc: totalDoc
    }));
  }catch(e){
    return res.status(400).json(message(e?.message, e))
  }
});


module.exports = appRouter;
