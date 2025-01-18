const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { base64url } = require("./helpers");
const cookieParser = require("cookie-parser");

const multer = require("multer");
const path = require("path");
const fs = require('fs');  // Import fs module


const app = express();
const port = 3000;
const jwtSecret =
  "PeZbpag1X/VOd0N1Tv0dwfLh0H2YtauDaOMp3vXprvpSMibxGlBjE/2UtQDkTxwOEA3his1KBwUyIY92NSN6Cj9h1eSpTQ4sm5vGJYdgsMfdh8uZR0wLgW2GewaXqpzO/l4zK3E3M9QBupEEtvY+cLzkcMaMbcCoI4dwo9huChyu/cCTPIBEcGwJ1v1ep2bpqPjiIFW/8jUjadUwj3z7Gok/6lNYkya7J0iVb+VLvD25ByS+NmFC8yVRecu4JygTo+0NxvKGWWTDZX3gsJ383+Ho4wlDqjWNVgRKcZ08OzLQKcitX0Mq2VgZjvQB8UqC6smBx/Gz67brVKFy4BB6ZQ==";

// Middleware
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder to save uploaded files
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`); // Rename file with timestamp
  },
});

const upload = multer({ storage });

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get('/generate-csv', (req, res) => {
  // Dữ liệu cần chuyển đổi thành CSV
  const data = [
    { name: "John", age: 30, city: "New York" },
    { name: "Jane", age: 25, city: "Los Angeles" },
    { name: "Doe", age: 22, city: "Chicago" }
  ];

  // Tạo nội dung CSV từ dữ liệu
  const csvContent = generateCSV(data);

  // Lưu CSV vào file
  const filePath = saveCSVToFile(csvContent);

  // Gửi file CSV cho client để tải về
  res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
  res.setHeader('Content-Type', 'text/csv');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error sending file');
    }

    // Xóa file sau khi gửi xong (tuỳ chọn)
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      } else {
        console.log('File deleted successfully');
      }
    });
  });
});

const generateCSV = (data) => {
  const header = Object.keys(data[0]).join(",");  
  const rows = data.map(row => Object.values(row).join(","));
  return [header, ...rows].join("\n");
};

const saveCSVToFile = (csvContent) => {
  const filename = `audit_results_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  const filePath = path.join(__dirname, 'uploads', filename);

  fs.writeFileSync(filePath, csvContent);
  return filePath;
};

// API nhận requestId, tạo file và trả về
app.get('/generate-file', (req, res) => {
  const requestId = req.query.requestId; // Lấy requestId từ query parameter

  if (!requestId) {
    return res.status(400).json({ error: 'requestId is required' });
  }

  // Tên file: audit_results_<timestamp>.txt
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `audit_results_${timestamp}.txt`;

  // Nội dung file: requestId
  const content = `Request ID: ${requestId}`;

  // Ghi nội dung vào file (trong thư mục tạm)
  const filePath = path.join(__dirname, filename);
  
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return res.status(500).json({ error: 'Failed to generate file' });
    }

    // Trả file về client
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending file');
      } else {
        // Xóa file sau khi gửi thành công
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('Error deleting file:', err);
          }
        });
      }
    });
  });
});

// API route to handle file upload
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.status(200).json({
    message: "File uploaded successfully",
    file: req.file,
  });

  // Giả lập xử lý lâu hơn 120 giây
  // setTimeout(() => {
  //   res.status(200).json({ message: 'File processed successfully!', file: req.file });
  // }, 130000); // 130 giây (dài hơn 120 giây để gây timeout ở client)
});


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

// [POST] /api/interval
app.post("/api/interval", (req, res) => {
  console.log("Client connected");
  console.log(req.body)
  if (req.body  ) {
    const newInterval = req.body.interval;
    // Update the interval if received a new value from the client
    console.log(`New interval: ${newInterval} second(s)`);
    if (!isNaN(newInterval) && newInterval > 0) {
      const value = Math.floor(Math.random() * 100);
      return res.status(200).json({
        randomValue: value.toString(),
      });
    } else {
      return res.status(400).json({
        message: "Bad request",
      });
    }
  } else {
    return res.status(400).json({
      message: "Bad request",
    });
  }
});

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

  if (!refreshToken) {
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
  const cookies = [`accessToken=${newAccessToken}; httpOnly; max-age=300`, `refreshToken=${newRefreshToken}; httpOnly; max-age=300`];

  res.setHeader("Set-Cookie", cookies).json(user);
});

// [POST] /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  const cookies = [`accessToken=; httpOnly; max-age=300`, `refreshToken=; httpOnly; max-age=300`];

  res.setHeader("Set-Cookie", cookies).json({
    logout: "ok",
  });
});

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
  const cookies = [`accessToken=${accessToken}; httpOnly; max-age=300`, `refreshToken=${refreshToken}; httpOnly; max-age=300`];

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
    exp: Date.now() + (3600000 / 60) * 2, // 2  minute
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
