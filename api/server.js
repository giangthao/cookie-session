const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { base64url } = require("./helpers");
const cookieParser = require("cookie-parser");

const app = express();
const port = 3000;
const jwtSecret =
  "PeZbpag1X/VOd0N1Tv0dwfLh0H2YtauDaOMp3vXprvpSMibxGlBjE/2UtQDkTxwOEA3his1KBwUyIY92NSN6Cj9h1eSpTQ4sm5vGJYdgsMfdh8uZR0wLgW2GewaXqpzO/l4zK3E3M9QBupEEtvY+cLzkcMaMbcCoI4dwo9huChyu/cCTPIBEcGwJ1v1ep2bpqPjiIFW/8jUjadUwj3z7Gok/6lNYkya7J0iVb+VLvD25ByS+NmFC8yVRecu4JygTo+0NxvKGWWTDZX3gsJ383+Ho4wlDqjWNVgRKcZ08OzLQKcitX0Mq2VgZjvQB8UqC6smBx/Gz67brVKFy4BB6ZQ==";

app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Fake DBs
const db = {
  users: [
    {
      id: 1,
      username: "nguyenvanagmailcom",
      password: "123456", // not plaintext, use hash
      name: "Nguyen Van A",
      role: {
        id: 1, // 1 - manage dataset ; 2 - manage all dataset and rule
      },
    },
    {
      id: 2,
      username: "nguyenvanb",
      password: "123456",
      name: "Nguyen Van B",
      role: {
        id: 2,
      },
    },
    {
      id: 3,
      username: "nguyenvanc",
      password: "123456",
      name: "Nguyen Van C",
      role: null,
    },
  ],
  datasets: [
    {
      id: 1,
      name: "Dataset name 1",
      fields: ["CELL", "FGF", "MIS"],
      rangeInput: false,
    },
    {
      id: 1,
      name: "Dataset name 2",
      fields: ["CELL", "FGF", "MIS"],
      rangeInput: false,
    },
    {
      id: 1,
      name: "Dataset name 3",
      fields: ["CELL"],
      rangeInput: true,
    },
  ],
};

// [POST] /api/auth/test-cookie
app.post("/api/auth/test-cookie", (req, res) => {
  console.log("Test cookie");
  const cookies = req.cookies;
  console.log(cookies);
  return res.json({ meesage: "test" });
});

// [GET] /api/auth/dataset
app.get("/api/auth/dataset", (req, res) => {
  const accessToken = req.cookies.accessToken;
  console.log(req.cookies);
  //console.log("TOKEN: ", accessToken);

  if (!accessToken) {
    return res.status(403).json({
      message: "Unauthorized",
      reason: "Not found token",
    });
  }

  const [encodedHeader, encodePlayload, tokenSignature] = accessToken.split(".");
  const tokenData = `${encodedHeader}.${encodePlayload}`;

  const hmac = crypto.createHmac("sha256", jwtSecret);
  const signature = hmac.update(tokenData).digest("base64");

  if (signature !== tokenSignature) {
    return res.status(403).json({
      message: "Unauthorized",
      reason: "Token is not valid",
    });
  }

  const payload = JSON.parse(atob(encodePlayload));
  const user = db.users.find((user) => user.id === payload.sub);

  if (!user) {
    return res.status(403).json({
      message: "Unauthorized",
      reason: "Not found subject",
    });
  }
  if (payload.exp < Date.now()) {
    return res.status(401).json({
      message: "Unauthorized",
      reason: "Token is expried",
    });
  }

  const dataset = db.datasets;
  res.json(dataset);
});

// [POST] /api/auth/refresh-token
app.post("/api/auth/refresh-token", (req, res) => {
  console.log("Refresh token");

  const refreshToken = req.cookies.refreshToken;
  console.log(req.cookies);

 
  if(!refreshToken) {
    return res.status(403).json({
      message: "Unauthorized",
      reason: "Not found token",
    });
  }
  const [encodedHeader, encodePlayload, tokenSignature] = refreshToken.split(".");
  const tokenData = `${encodedHeader}.${encodePlayload}`;

  const hmac = crypto.createHmac("sha256", jwtSecret);
  const signature = hmac.update(tokenData).digest("base64");

  if (signature !== tokenSignature) {
    return res.status(403).json({
      message: "Unauthorized",
      reason: "Token is not valid",
    });
  }

  const payload = JSON.parse(atob(encodePlayload));
  const user = db.users.find((user) => user.id === payload.sub);

  if (!user) {
    return res.status(403).json({
      message: "Unauthorized",
      reason: "Not found subject",
    });
  }

  if (payload.exp < Date.now()) {
    return res.status(403).json({
      message: "Unauthorized",
      reason: "Refresh Token is expried",
    });
  }
   

  const newAccessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);

   // 3600: 1h, 60: 1p, 300: 5p
   const cookies = [
    `accessToken=${newAccessToken}; httpOnly; max-age=300`,
    `refreshToken=${newRefreshToken}; httpOnly; max-age=300`
  ];

  res.setHeader("Set-Cookie", cookies).json(user);

  
  
});

// [POST] /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  const cookies = [
    `accessToken=; httpOnly; max-age=300`,
    `refreshToken=; httpOnly; max-age=300`
  ];

  res.setHeader("Set-Cookie", cookies).json({
    logout: "ok"
  });
})

// [POST] /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find((user) => user.email === email && user.password === password);

  if (!user) {
    res.status(401).json({
      message: "Unauthorired",
    });
    return;
  }

  console.log(email, password);

  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload = {
    sub: user.id,
    exp: Date.now() + 3600000,
  };

  // encoded base64(json(header & payload))
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  // create token data <header>.<payload>
  const tokenData = `${encodedHeader}.${encodedPayload}`;

  // create signature
  const hmac = crypto.createHmac("sha256", jwtSecret);
  const signature = hmac.update(tokenData).digest("base64");

  res.json({
    token: `${tokenData}.${signature}`,
  });
});

// [GET] /api/auth/me
app.get("/api/auth/me", (req, res) => {
  //console.log(req.headers.authorization.slice(7));
  const token = req.headers.authorization?.slice(7);

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
      reason: "Not found token",
    });
  }

  const [encodedHeader, encodePlayload, tokenSignature] = token.split(".");
  const tokenData = `${encodedHeader}.${encodePlayload}`;

  const hmac = crypto.createHmac("sha256", jwtSecret);
  const signature = hmac.update(tokenData).digest("base64");

  if (signature !== tokenSignature) {
    return res.status(401).json({
      message: "Unauthorized",
      reason: "Token is not valid",
    });
  }

  const payload = JSON.parse(atob(encodePlayload));
  const user = db.users.find((user) => user.id === payload.sub);

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
      reason: "Not found subject",
    });
  }
  if (payload.exp < Date.now()) {
    return res.status(401).json({
      message: "Unauthorized",
      reason: "Token is expried",
    });
  }
  res.json(user);
});

app.listen(port, () => {
  console.log(`Application is running in port ${port} `);
});

// [POST]/api/auth/login-test
app.post("/api/auth/login-test", (req, res) => {
  console.log("Nhận request");
  const { username, password } = req.body;
  const user = db.users.find((user) => user.username === username && user.password === password);

  if (!user) {
    res.status(403).json({
      message: "Username or password not valid",
    });
    return;
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  
  // 3600: 1h, 60: 1p, 300: 5p
  const cookies = [
    `accessToken=${accessToken}; httpOnly; max-age=300`,
    `refreshToken=${refreshToken}; httpOnly; max-age=300`
  ];

  res.setHeader("Set-Cookie", cookies).json(user);
});

function createAccessToken(user) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload = {
    sub: user.id,
    exp: Date.now() + 3600000 / 60, // 1  minute
  };

  // encoded base64(json(header & payload))
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  // create token data <header>.<payload>
  const tokenData = `${encodedHeader}.${encodedPayload}`;

  // create signature
  const hmac = crypto.createHmac("sha256", jwtSecret);
  const signature = hmac.update(tokenData).digest("base64");

  const accessToken = `${tokenData}.${signature}`;
  return accessToken;

}

function createRefreshToken(user) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload = {
    sub: user.id,
    exp: Date.now() + 3600000 / 60 * 2 , // 2  minute
  };

  // encoded base64(json(header & payload))
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  // create token data <header>.<payload>
  const tokenData = `${encodedHeader}.${encodedPayload}`;

  // create signature
  const hmac = crypto.createHmac("sha256", jwtSecret);
  const signature = hmac.update(tokenData).digest("base64");

  const refreshToken = `${tokenData}.${signature}`;
  return refreshToken;

}

// https.createServer({
//     key: fs.readFileSync("testcookie.com+2-key.pem"),
//     cert: fs.readFileSync("testcookie.com+2.pem")
// }, app)
// .listen(port, () => {
//     console.log(`Demo app is running in port ${port}`);
// })
