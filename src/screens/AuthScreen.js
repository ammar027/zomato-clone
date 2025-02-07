// app/auth/AuthScreen.js
import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import SignIn from './SignIn';
import SignUp from './SignUp';

const AuthScreen = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  return (
    <AuthLayout
      title={isSignUp ? 'Create Account' : 'Welcome Back'}
      subtitle={isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
    >
      {isSignUp ? (
        <SignIn
        loading={loading}
        setLoading={setLoading}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
      />
      ) : (
        <SignUp
          loading={loading}
          setLoading={setLoading}
          fullName={fullName}
          setFullName={setFullName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          profileImage={profileImage}
          setProfileImage={setProfileImage}
        />
      )}
    </AuthLayout>
  );
};

export default AuthScreen;
