const validinfo = (req, res, next) => {
  const { email, name, password } = req.body;
  console.log(email, name, password);
  function validEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  console.log("in validinfo middlewere");
  if (req.path === "/signup") {
    if (![email, name, password].every(Boolean)) {
      console.log("missing credential");
      return res.status(401).json("Missing Credentials");
    } else if (!validEmail(email)) {
      console.log("not valid email");
      return res.json("Invalid Email");
    }
  } else if (req.path === "/login") {
    if (![email, password].every(Boolean)) {
      return res.status(401).json("missing credentials");
    } else if (!validEmail(email)) {
      return res.status(401).json("invalid email");
    }
  }
  next();
};
export default validinfo;



//invoke ci