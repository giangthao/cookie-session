const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const  {base64url } = require('./helpers');


const app = express();
const port = 3000;
const jwtSecret = 'PeZbpag1X/VOd0N1Tv0dwfLh0H2YtauDaOMp3vXprvpSMibxGlBjE/2UtQDkTxwOEA3his1KBwUyIY92NSN6Cj9h1eSpTQ4sm5vGJYdgsMfdh8uZR0wLgW2GewaXqpzO/l4zK3E3M9QBupEEtvY+cLzkcMaMbcCoI4dwo9huChyu/cCTPIBEcGwJ1v1ep2bpqPjiIFW/8jUjadUwj3z7Gok/6lNYkya7J0iVb+VLvD25ByS+NmFC8yVRecu4JygTo+0NxvKGWWTDZX3gsJ383+Ho4wlDqjWNVgRKcZ08OzLQKcitX0Mq2VgZjvQB8UqC6smBx/Gz67brVKFy4BB6ZQ==';


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

    const header = {
        alg: 'HS256',
        typ: 'JWT'
    }
    const payload = {
        sub: user.id,
        exp: Date.now() + 3600000
    }
    
    // encoded base64(json(header & payload))
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));

    // create token data <header>.<payload>
    const tokenData = `${encodedHeader}.${encodedPayload}`;

    // create signature
    const hmac = crypto.createHmac('sha256', jwtSecret);
    const signature = hmac.update(tokenData).digest("base64");

    res.json({
        token: `${tokenData}.${signature}`
    })
});

// [GET] /api/auth/me
app.get("/api/auth/me", (req, res) => {
    //console.log(req.headers.authorization.slice(7));
    const token = req.headers.authorization?.slice(7);

    if(!token) {
      return res.status(401).json({
        message: 'Unauthorized',
        reason: 'Not found token'
      })
    }

    const [encodedHeader, encodePlayload, tokenSignature] = token.split('.');
    const tokenData = `${encodedHeader}.${encodePlayload}`;

    const hmac = crypto.createHmac('sha256', jwtSecret);
    const signature = hmac.update(tokenData).digest('base64');

    if(signature !== tokenSignature) {
       return res.status(401).json({
        message: 'Unauthorized',
        reason: 'Token is not valid'
       })

    }

    const payload = JSON.parse(atob(encodePlayload));
    const user = db.users.find(user => user.id === payload.sub);

    if(!user) {
        return res.status(401).json({
            message: 'Unauthorized',
            reason: 'Not found subject'
        })
    }
    if(payload.exp < Date.now()) {
        return res.status(401).json({
            message: 'Unauthorized',
            reason: 'Token is expried'
        })
    }
    res.json(user);
})

app.listen(port, () => {
    console.log(`Application is running in port ${port} `);
})

// https.createServer({
//     key: fs.readFileSync("testcookie.com+2-key.pem"),
//     cert: fs.readFileSync("testcookie.com+2.pem")
// }, app)
// .listen(port, () => {
//     console.log(`Demo app is running in port ${port}`);
// })