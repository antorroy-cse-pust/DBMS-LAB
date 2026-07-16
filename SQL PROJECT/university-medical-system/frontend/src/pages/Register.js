// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaPhone } from 'react-icons/fa';
// import { useAuth } from '../context/AuthContext';

// const Register = () => {
//   const [form, setForm] = useState({
//     username: '', email: '', password: '', confirmPassword: '',
//     full_name: '', role: 'student', phone: '', department: '', student_id: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const { register } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.full_name || !form.email || !form.password || !form.username)
//       return toast.error('Please fill all required fields');
//     if (form.password !== form.confirmPassword)
//       return toast.error('Passwords do not match');
//     if (form.password.length < 6)
//       return toast.error('Password must be at least 6 characters');

//     setLoading(true);
//     try {
//       await register(form);
//       toast.success('Account created successfully!');
//       navigate('/app/dashboard');
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const f = (k, v) => setForm({...form, [k]: v});

//   return (
//     <div className="auth-page" style={{paddingTop:40, paddingBottom:40}}>
//       <div className="auth-card" style={{maxWidth:500}}>
//         <div className="auth-logo">
//           <div className="icon">🏥</div>
//           <h1>Create Account</h1>
//           <p>Register for University Medical Center</p>
//         </div>

//         <form onSubmit={handleSubmit} className="auth-form">
//           <div className="grid-2">
//             <div className="form-group">
//               <label className="form-label">Full Name *</label>
//               <input type="text" className="form-input" placeholder="John Doe"
//                 value={form.full_name} onChange={e => f('full_name', e.target.value)} />
//             </div>
//             <div className="form-group">
//               <label className="form-label">Username *</label>
//               <input type="text" className="form-input" placeholder="johndoe"
//                 value={form.username} onChange={e => f('username', e.target.value)} />
//             </div>
//           </div>

//           <div className="form-group">
//             <label className="form-label"><FaEnvelope style={{marginRight:6}}/>Email *</label>
//             <input type="email" className="form-input" placeholder="your@email.edu"
//               value={form.email} onChange={e => f('email', e.target.value)} />
//           </div>

//           <div className="grid-2">
//             <div className="form-group">
//               <label className="form-label"><FaLock style={{marginRight:6}}/>Password *</label>
//               <input type="password" className="form-input" placeholder="••••••••"
//                 value={form.password} onChange={e => f('password', e.target.value)} />
//             </div>
//             <div className="form-group">
//               <label className="form-label">Confirm Password *</label>
//               <input type="password" className="form-input" placeholder="••••••••"
//                 value={form.confirmPassword} onChange={e => f('confirmPassword', e.target.value)} />
//             </div>
//           </div>

//           <div className="grid-2">
//             <div className="form-group">
//               <label className="form-label">Role *</label>
//               <select className="form-select" value={form.role} onChange={e => f('role', e.target.value)}>
//                 <option value="student">Student</option>
//                 <option value="teacher">Teacher</option>
//                 <option value="staff">Staff</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label className="form-label"><FaPhone style={{marginRight:6}}/>Phone</label>
//               <input type="tel" className="form-input" placeholder="+1-555-0000"
//                 value={form.phone} onChange={e => f('phone', e.target.value)} />
//             </div>
//           </div>

//           <div className="grid-2">
//             <div className="form-group">
//               <label className="form-label">Department</label>
//               <input type="text" className="form-input" placeholder="Computer Science"
//                 value={form.department} onChange={e => f('department', e.target.value)} />
//             </div>
//             <div className="form-group">
//               <label className="form-label">Student/Staff ID</label>
//               <input type="text" className="form-input" placeholder="CS2024001"
//                 value={form.student_id} onChange={e => f('student_id', e.target.value)} />
//             </div>
//           </div>

//           <button type="submit" className="auth-btn" disabled={loading}>
//             {loading ? 'Creating account...' : (<><FaUserPlus style={{marginRight:8}}/>Create Account</>)}
//           </button>
//         </form>

//         <div className="auth-link">
//           Already have an account? <Link to="/login">Sign in</Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;







import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    full_name: '', role: 'student', phone: '', department: '', student_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password || !form.username)
      return toast.error('Please fill all required fields');
    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const f = (k, v) => setForm({...form, [k]: v});

  const eyeBtn = (visible, toggle) => (
    <button
      type="button"
      onClick={toggle}
      style={{
        position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
        background:'none', border:'none', cursor:'pointer',
        color:'rgba(255,255,255,0.6)', fontSize:16, padding:0,
        display:'flex', alignItems:'center'
      }}
      tabIndex={-1}
      title={visible ? 'Hide password' : 'Show password'}
    >
      {visible ? <FaEyeSlash /> : <FaEye />}
    </button>
  );

  return (
    <div className="auth-page" style={{paddingTop:40, paddingBottom:40}}>
      <div className="auth-card" style={{maxWidth:500}}>
        <div className="auth-logo">
          <div className="icon">🏥</div>
          <h1>Create Account</h1>
          <p>Register for University Medical Center</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-input" placeholder="John Doe"
                value={form.full_name} onChange={e => f('full_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input type="text" className="form-input" placeholder="johndoe"
                value={form.username} onChange={e => f('username', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><FaEnvelope style={{marginRight:6}}/>Email *</label>
            <input type="email" className="form-input" placeholder="your@email.edu"
              value={form.email} onChange={e => f('email', e.target.value)} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label"><FaLock style={{marginRight:6}}/>Password *</label>
              <div style={{position:'relative'}}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input" placeholder="••••••••"
                  value={form.password} onChange={e => f('password', e.target.value)}
                  style={{paddingRight:42}}
                />
                {eyeBtn(showPassword, () => setShowPassword(p => !p))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div style={{position:'relative'}}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="form-input" placeholder="••••••••"
                  value={form.confirmPassword} onChange={e => f('confirmPassword', e.target.value)}
                  style={{paddingRight:42}}
                />
                {eyeBtn(showConfirm, () => setShowConfirm(p => !p))}
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-select" value={form.role} onChange={e => f('role', e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><FaPhone style={{marginRight:6}}/>Phone</label>
              <input type="tel" className="form-input" placeholder="+1-555-0000"
                value={form.phone} onChange={e => f('phone', e.target.value)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input type="text" className="form-input" placeholder="Computer Science"
                value={form.department} onChange={e => f('department', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Student/Staff ID</label>
              <input type="text" className="form-input" placeholder="CS2024001"
                value={form.student_id} onChange={e => f('student_id', e.target.value)} />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : (<><FaUserPlus style={{marginRight:8}}/>Create Account</>)}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;