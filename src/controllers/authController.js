const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
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
  const existingUser = await prisma.profile.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered'
    });
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 12);

  // 트랜잭션으로 사용자 생성
  const result = await prisma.$transaction(async (tx) => {
    // 프로필 생성
    const profile = await tx.profile.create({
      data: {
        email,
        fullName,
        // 비밀번호는 별도 테이블에 저장하거나 auth.users에 저장
        // 여기서는 간단히 처리
      }
    });

    // 사용자 역할 생성
    const userRole = await tx.userRole.create({
      data: {
        userId: profile.id,
        role
      }
    });

    // 파트너인 경우 파트너 프로필 생성
    if (role === 'partner') {
      await tx.partnerProfile.create({
        data: {
          userId: profile.id,
          available: true
        }
      });
    }

    return { profile, userRole };
  });

  // JWT 토큰 생성
  const token = generateToken(result.profile.id);

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
  const user = await prisma.profile.findUnique({
    where: { email },
    include: {
      userRole: true
    }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // 비밀번호 확인 (실제 구현에서는 auth.users 테이블에서 확인)
  // 여기서는 간단히 처리
  const isPasswordValid = await bcrypt.compare(password, 'hashed_password_from_auth_users');
  
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
  const user = await prisma.profile.findUnique({
    where: { id: req.user.id },
    include: {
      userRole: true,
      partnerProfile: {
        include: {
          partnerTechStacks: {
            include: {
              techStack: true
            }
          }
        }
      }
    }
  });

  if (!user) {
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
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        role: user.userRole?.role || 'client',
        partnerProfile: user.partnerProfile
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
