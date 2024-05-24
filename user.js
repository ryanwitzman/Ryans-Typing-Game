const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = (db) => {
  const saltRounds = 10;

  async function register(username, password) {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = await db.get(username);

    if (user) {
      throw new Error("User already exists.");
    }

    await db.set(username, { password: hashedPassword });
    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return token;
  }

  async function login(username, password) {
    const user = await db.get(username);

    if (!user) {
      throw new Error("User does not exist.");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error("Invalid password.");
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return token;
  }

  return { register, login };
};
