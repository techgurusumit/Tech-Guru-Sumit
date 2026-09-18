import React from 'react';
import { Lock, CheckCircle2, LogIn } from 'lucide-react';
import { supabase } from './share-config';
import './styles.css';

export default function ResetPasswordPage(){
 const[password,setPassword]=React.useState('');
 const[confirm,setConfirm]=React.useState('');
 const[error,setError]=React.useState('');
 const[done,setDone]=React.useState(false);
 const[loading,setLoading]=React.useState(false);

 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();
  setError('');
  if(password.length<6)return setError('Password must be at least 6 characters.');
  if(password!==confirm)return setError('Passwords do not match.');
  if(!supabase)return setError('Password reset is not configured.');
  setLoading(true);
  try{
   const {data:sessionData}=await supabase.auth.getSession();
   if(!sessionData.session)return setError('This reset link is invalid or has expired. Please request a new reset link.');
   const {error:updateError}=await supabase.auth.updateUser({password});
   if(updateError)throw updateError;
   setDone(true);
  }catch(err){
   setError(err instanceof Error?err.message:'Could not update your password. Please request a new reset link.');
  }finally{
   setLoading(false);
  }
 };

 return <div className="auth-shell"><div className="auth-card">
  <div className="auth-brand"><div className="brand-mark">TGS</div><div><strong>TGS Tournament Manager</strong><span>Tech Guru Sumit</span></div></div>
  {!done?<><div className="auth-title"><h1>Set new password</h1><p>Create a new password for your TGS Tournament Manager account.</p></div>
   <form onSubmit={submit}>
    <label><span className="password-label"><Lock size={13}/> New Password</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" autoFocus/></label>
    <label><span className="password-label"><Lock size={13}/> Confirm Password</span><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter password"/></label>
    {error&&<div className="form-error">{error}</div>}
    <button className="primary-btn auth-submit" type="submit" disabled={loading}>{loading?'Updating…':'Update Password'}</button>
   </form>
  </>:<><div className="auth-title"><h1>Password updated</h1><p>Your password has been changed successfully. You can now login with your new password.</p></div>
    <button className="primary-btn auth-submit" onClick={()=>{window.location.href=window.location.origin+'/'}}><LogIn size={17}/> Back to Login</button>
    <div className="auth-success"><CheckCircle2 size={15}/> Password reset completed successfully.</div>
  </>}
 </div></div>;
}
