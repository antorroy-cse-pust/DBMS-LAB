// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
// import { useAuth } from '../context/AuthContext';

// const Login = () => {
//   const [form, setForm] = useState({ email: '', password: '' });
//   const [loading, setLoading] = useState(false);
//   const { login, settings } = useAuth();
//   const navigate = useNavigate();

//   const uniName = settings?.university_name || 'University Medical Center';
//   const uniLogo = settings?.university_logo ? `http://localhost:5000${settings.university_logo}` : null;

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.email || !form.password) return toast.error('Please fill all fields');
//     setLoading(true);
//     try {
//       await login(form.email, form.password);
//       toast.success('Welcome back!');
//       navigate('/app/dashboard');
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Login failed');
//     } finally { setLoading(false); }
//   };

//   const quickLogin = (email, pass) => setForm({ email, password: pass });

//   return (
//     <div className="auth-page">
//       <div className="auth-card">
//         <div className="auth-logo">
//           {uniLogo
//             ? <img src={uniLogo} alt="logo" style={{width:70,height:70,borderRadius:16,objectFit:'cover',marginBottom:8}} />
//             : <div className="icon">🏥</div>
//           }
//           <h1>{uniName}</h1>
//           <p>Sign in to access your health portal</p>
//         </div>

//         <form onSubmit={handleSubmit} className="auth-form">
//           <div className="form-group">
//             <label className="form-label"><FaEnvelope style={{marginRight:6}}/>Email Address</label>
//             <input type="email" className="form-input" placeholder="your@email.edu"
//               value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
//           </div>
//           <div className="form-group">
//             <label className="form-label"><FaLock style={{marginRight:6}}/>Password</label>
//             <input type="password" className="form-input" placeholder="••••••••"
//               value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
//           </div>
//           <button type="submit" className="auth-btn" disabled={loading}>
//             {loading ? 'Signing in...' : <><FaSignInAlt style={{marginRight:8}}/>Sign In</>}
//           </button>
//         </form>

//         <div style={{marginTop:20}}>
//           <p style={{color:'rgba(255,255,255,0.6)',fontSize:11,textAlign:'center',marginBottom:10}}>QUICK LOGIN (DEMO)</p>
//           <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
//             {[
//               {label:'👑 Admin', email:'admin@university.edu', pass:'admin123'},
//               {label:'🩺 Doctor', email:'dr.smith@university.edu', pass:'doctor123'},
//               {label:'🎓 Student', email:'john.doe@student.edu', pass:'student123'},
//             ].map(q => (
//               <button key={q.label} onClick={() => quickLogin(q.email, q.pass)} style={{
//                 flex:1, padding:'7px 4px', background:'rgba(255,255,255,0.15)',
//                 border:'1px solid rgba(255,255,255,0.3)', borderRadius:8,
//                 color:'white', fontSize:12, cursor:'pointer', fontWeight:500
//               }}>{q.label}</button>
//             ))}
//           </div>
//         </div>

//         <div className="auth-link">
//           Don't have an account? <Link to="/register">Register here</Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;




import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaEnvelope, FaLock, FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, settings } = useAuth();
  const navigate = useNavigate();

  const uniName = settings?.university_name || 'University Medical Center';
  const uniLogo = settings?.university_logo ? `http://localhost:5000${settings.university_logo}` : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          {uniLogo
            ? <img src={uniLogo} alt="logo" style={{width:70,height:70,borderRadius:16,objectFit:'cover',marginBottom:8}} />
            : <div className="icon">🏥</div>
          }
          <h1>{uniName}</h1>
          <p>Sign in to access your health portal</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label"><FaEnvelope style={{marginRight:6}}/>Email Address</label>
            <input type="email" className="form-input" placeholder="your@email.edu"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label"><FaLock style={{marginRight:6}}/>Password</label>
            <div style={{position:'relative'}}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                style={{paddingRight: 42}}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer',
                  color:'rgba(255,255,255,0.6)', fontSize:16, padding:0,
                  display:'flex', alignItems:'center'
                }}
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : <><FaSignInAlt style={{marginRight:8}}/>Sign In</>}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;