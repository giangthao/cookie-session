const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;

app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

//Fake DB
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
    ]
}

const sessions = {};

// [GET] /login
app.get('/login', (req,res) => {

    res.render('pages/login');
})

// [POST] /login
app.post('/login', (req, res) => {
   // console.log(req.body)

    const {email, password} = req.body;
    const user = db.users.find(user => user.email === email && user.password === password);

    if(user) {
       const sessionId = Date.now().toString();
       sessions[sessionId] = {
        userId: user.id
        // createdAt
        // maxage: 3600
       }

       console.log(sessions);

       res.setHeader(
              "Set-Cookie", 
               `sessionId=${sessionId}; max-age=3600; httpOnly`
            ).redirect('/dashboard');

       return;     
    }
   res.send('<h2>Email or Password is nor valid!!</h2>')
})


// [GET] //logout
app.get('/logout', (req, res) => {
    delete sessions[req.cookies.sessionId];
   
    res.setHeader(
        'Set-Cookie', 'sessionId=; max-age=0'
    ).redirect('/login');
    
} );

// [GET] /dashboard
app.get('/dashboard', (req, res) => {
    const session = sessions[req.cookies.sessionId];

    if(!session) {
        res.redirect('/login');
    }
    const user = db.users.find(user => user.id === session.userId);
    if(!user) {
        res.redirect('/login');
    }
    
    res.render('pages/dashboard', {user})
})


// [GET] /
app.get('/', (req, res) => {

    res.render('pages/index')

})


app.listen(port, () => {
    console.log(`Demo app is running on port:  ${port} `)
});