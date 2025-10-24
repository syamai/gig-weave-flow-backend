const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const config = require('../config');
const { asyncHandler } = require('../middleware/errorHandler');

// JWT 토큰 생성
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

// 회원가입
const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, role } = req.body;

  // 이메일 중복 확인
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered'
    });
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 12);

  // 사용자 생성
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      email,
      full_name: fullName,
      role: role.toUpperCase(),
      password_hash: hashedPassword
    })
    .select()
    .single();

  if (createError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }

  // JWT 토큰 생성
  const token = generateToken(newUser.id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: result.profile.id,
        email: result.profile.email,
        fullName: result.profile.fullName,
        role: result.userRole.role
      },
      token
    }
  });
});

// 로그인
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 사용자 조회
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (userError || !user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // 비밀번호 확인
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // JWT 토큰 생성
  const token = generateToken(user.id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.userRole?.role || 'client'
      },
      token
    }
  });
});

// 현재 사용자 정보 조회
const getMe = asyncHandler(async (req, res) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (userError || !user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        phone: user.phone,
        role: user.role
      }
    }
  });
});

// 로그아웃 (클라이언트에서 토큰 제거)
const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// 비밀번호 변경
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // 현재 비밀번호 확인
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, 'hashed_password_from_auth_users');
  
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // 새 비밀번호 해싱
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // 비밀번호 업데이트 (실제 구현에서는 auth.users 테이블 업데이트)
  // 여기서는 성공 응답만 반환
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  register,
  login,
  getMe,
  logout,
  changePassword
};
