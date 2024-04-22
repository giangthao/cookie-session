const fs = require('fs');
const https = require('https');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));


//Fake DBs
const db = {
    users: [ 
        {
            id: 1,
            email: "nguyenvana@gmail.com",
            password: "123456", // not plaintext, use hash
            name: 'Nguyen Van A'
        },
        {
            id: 2,
            email: "nguyenvanb@gmail.com",
            password: "123456",
            name: "Nguyen Van B"
        },
        {
            id: 3,
            email: "nguyenvanc@gmail.com",
            password: "123456",
            name: "Nguyen Van C"
        }
    ],
    posts: [
        {
            id: 1,
            title: "Post title 1",
            description: 'Description 1'

        },
        {
            id: 2,
            title: 'Post title 2',
            description: 'Description 2'
        },
        {
            id: 3, 
            title: 'Post title 3', 
            description: 'Description 3'
        },
        {
            id: 4,
            title: 'Post title 4',
            description: 'Description 4'
        }
    ]
}

// Session
const sessions = {};

// [GET] /api/posts
app.get('/api/posts', (req, res) => {

    res.json(db.posts);

});

// [POST] /api/auth/login
app.post('/api/auth/login', (req, res) => {

    const {email, password} = req.body;
    const user = db.users.find(user => user.email === email && user.password === password );
     
    if(!user) {
        res.status(401)
        .json({
            message: 'Unauthorired'
        })
        return;
    }
    
   console.log(email, password);

   const sessionId = Date.now().toString();
   sessions[sessionId] = {sub: user.id}; // subject: userId

   res.setHeader('Set-Cookie', 
      `sessionId=${sessionId}; HttpOnly; Max-Age=3600; SameSite=None; Secure; Partitioned`)
   .json(user);

});

// [GET] /api/auth/me
app.get('/api/auth/me', (req, res) => {
   // console.log(req.cookies);
   const session = sessions[req.cookies.sessionId];

   if(!session) {
    return res.status(401).json({
        message: 'Unauthorized',
        reason: 'Not found cookie'
    })
   }

   const user = db.users.find(user => user.id === session.sub);
   if(!user) {
     return res.status(401).json({
        message: 'Unauthorize',
        reason: 'Not found information user'
     })
   }
   
    res.json(user);

})


// app.listen(port, () => {
//     console.log(`Application is running in port ${port} `);
// })

https.createServer({
    key: fs.readFileSync("testcookie.com+2-key.pem"),
    cert: fs.readFileSync("testcookie.com+2.pem")
}, app)
.listen(port, () => {
    console.log(`Demo app is running in port ${port}`);
})