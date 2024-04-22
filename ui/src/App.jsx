import {  useState, useEffect } from 'react'


// const baseApi = 'https://testcookie.com:3000/api';

const baseApi = 'http://localhost:3000/api'

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({
    email: 'nguyenvana@gmail.com',
    password: '123456'
  });


  const setFieldValue = ({ target: {name, value }}) => {
    setFields(prev => ({
      ...prev,
      [name]: value,
     
    }));
  }

  useEffect(() => {
    fetch(`${baseApi}/auth/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.token}`
      }
    })
    .then(res => {
      if(res.ok) return res.json();

      throw res;
    })
    .then(me =>  {
      console.log(me);
      setUser(me);
    })
    .catch(error => {
       console.log(error);
    })

  }, [])

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    fetch(`${baseApi}/auth/login`,
        {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(fields)
        })
    .then(res => {
      if(res.ok) return res.json();
      throw res;

    })
    .then(({token}) => {
      localStorage.setItem('token', token);
    })
    .catch((err) => {
      console.log(err);
      if(err.status === 401) {
        setError("Email or Passeord is failure.");
        return;
      }
      setError('Unsure about the error, please try again or contact to be supported.')
    })    
  }

  return (
    <div>
       {user ? (
        <h1>Hello {user.name}</h1>
       ) : (
        <>
         <h1>Log in</h1>
      <form onSubmit={handleLogin}>
       <div>
         <label htmlFor='email'>Email</label>
         <input 
             type='text' 
             name='email'
             placeholder='Email'
             value={fields.email} 
             onChange={setFieldValue} 
             id='email' />
         
        </div>
        <div>
          <label htmlFor='password'>Password</label>
          <input
               type='password'
               name='password'
               value={fields.password}
               onChange={setFieldValue} 
               placeholder='Password' 
               id='password' />
        </div>
        <button>Login</button>
      </form>

      {!!error && <p style={{color: 'red', fontSize: '14px', fontStyle: 'italic'}}>{error}</p>}
        </>
       )}
    </div>
  )
}

export default App
