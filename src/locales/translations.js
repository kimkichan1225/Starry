export const translations = {
  ko: {
    // 공통
    common: {
      login: '로그인',
      logout: '로그아웃',
      signup: '회원가입',
      next: '다음',
      prev: '이전',
      send: '전송',
      sending: '전송 중...',
      save: '저장',
      cancel: '취소',
      change: '변경',
      changing: '변경중...',
      loading: '로딩 중...',
      copyLink: '링크 복사하기',
      linkCopied: '링크가 복사되었습니다.',
      korean: '한국어',
      english: 'English',
    },

    // 로딩/로그인 페이지
    loading: {
      subtitle: '당신을 닮은, 단 하나의 별자리',
      email: '이메일',
      password: '비밀번호',
      loggingIn: '로그인 중...',
      simpleLogin: '간편 로그인',
      findEmail: '이메일 찾기',
      findPassword: '비밀번호 찾기',
      googleLogin: '구글 로그인',
      kakaoLogin: '카카오 로그인 (준비중)',
      invalidCredentials: '이메일 또는 비밀번호가 틀렸습니다.',
      loginFailed: '로그인에 실패했습니다.',
      devLogin: '개발자 로그인',
    },

    // 유저 페이지
    user: {
      personalSettings: '님의 개인설정',
      userId: '아이디',
      nickname: '닉네임',
      phone: '전화번호',
      password: '비밀번호',
      currentPassword: '현재 비밀번호',
      newPassword: '새로운 비밀번호',
      confirmPassword: '새로운 비밀번호 확인',
      enterNewPassword: '새로운 비밀번호를 입력해주세요.',
      passwordMismatch: '새로운 비밀번호가 일치하지 않습니다.',
      passwordTooShort: '비밀번호는 6자 이상이어야 합니다.',
      passwordChanged: '비밀번호가 성공적으로 변경되었습니다.',
      passwordChangeFailed: '비밀번호 변경에 실패했습니다.',
      enterNickname: '닉네임을 입력해주세요.',
      nicknameTooShort: '닉네임은 2자 이상이어야 합니다.',
      nicknameTooLong: '닉네임은 10자 이하여야 합니다.',
      nicknameChanged: '닉네임이 변경되었습니다.',
      nicknameChangeFailed: '닉네임 변경에 실패했습니다.',
      socialAccount: '소셜 계정 연동 관리',
      notLinked: '연동안됨',
      preparing: '준비중',
      googleCannotUnlink: '구글로 가입한 계정은 연동을 해제할 수 없습니다.',
      linkInfoNotFound: '연동 정보를 찾을 수 없습니다.',
      unlinkConfirm: '구글 연동을 해제하시겠습니까?',
      googleUnlinked: '구글 연동이 해제되었습니다.',
      googleLinkFailed: '구글 연동에 실패했습니다.',
      googleUnlinkFailed: '구글 연동 해제에 실패했습니다.',
      languageSetting: '언어설정',
      myQRCode: '내 밤하늘 QR코드',
      loginRequired: '로그인 필요',
    },

    // 설문 시작 페이지
    surveyStart: {
      giftStar: '밤하늘에 별을 선물하세요!',
      enterName: '이름을 입력해주세요.',
      pleaseEnterName: '이름을 입력해주세요.',
      notice1: '* 한 번 입력한 이름은 바꿀 수 없어요.',
      notice2: "* 신중하게 입력하고 '다음'으로 넘어가주세요.",
    },

    // 설문 질문 페이지
    survey: {
      questions: [
        {
          questionLine1: (nickname) => `${nickname} 님이`,
          questionLine2: '가장 중요하게 생각하는 것은?',
          options: [
            { label: '도전!', description: '용감하게 밀고 나간다' },
            { label: '실력!', description: '확실하게 해낸다' },
            { label: '지식!', description: '새로운 것을 알아낸다' },
            { label: '마음!', description: '사람들과 함께 해낸다' },
          ],
        },
        {
          questionLine1: (nickname) => `${nickname} 님의`,
          questionLine2: '새로운 상황에서 행동 스타일은?',
          options: [
            { label: '리더형!', description: '내가 이끌어간다' },
            { label: '유지형!', description: '방식을 끝까지 유지한다' },
            { label: '유연형!', description: '상황에 따라 바뀐다' },
            { label: '중재형!', description: '모두의 의견을 들어본다' },
          ],
        },
        {
          questionLine1: (nickname) => `${nickname} 님의`,
          questionLine2: '첫인상은?',
          options: [
            { label: '외향적!', description: '활발한 에너지' },
            { label: '내향적!', description: '차분하고 신중함' },
            { label: '균형적!', description: '친근하고 편함' },
            { label: '개성!', description: '어디로 튈지 모름' },
          ],
        },
        {
          questionLine1: (nickname) => `${nickname} 님이`,
          questionLine2: '가장 행복한 상황은?',
          options: [
            { label: '게임 레벨이', description: '올랐을 때' },
            { label: '재미있는 비밀을', description: '알았을 때' },
            { label: '노력한 일에', description: '칭찬을 받을 때' },
            { label: '친구들과', description: '카페에 갈 때' },
          ],
        },
        {
          questionLine1: (nickname) => `${nickname} 님이`,
          questionLine2: '스트레스를 푸는 방법은?',
          options: [
            { label: '맛있는걸 먹거나', description: '푹 잔다' },
            { label: '친한 사람에게', description: '이야기한다' },
            { label: '운동이나', description: '노래를 한다' },
            { label: '스트레스 받은', description: '이유를 따져본다' },
          ],
        },
      ],
      starCompleted: '님께 보낼',
      starCompletedLine2: '별이 완성되었어요!',
      receivedStar1: '님이',
      receivedStar2: '님이',
      receivedStar3: '선물한 별을 받았어요!',
      viewNightSky: '님의 밤하늘 보기',
      createMyNightSky: '내 밤하늘 만들기',
      nightSky: '님의 밤하늘',
      sendFailed: '별 전송에 실패했습니다. 다시 시도해주세요.',
    },

    // 푸터
    footer: {
      adInquiry: '광고 문의',
      otherInquiry: '기타 문의',
      copyright: 'Copyright ©2025 123456789. All rights reserved.',
      developer: '개발자',
      designer: '디자이너',
    },

    // Starry 페이지 (소개)
    starry: {
      title: 'Starry의 이야기',
      section1Title: '모두는 하나의 별',
      section1Text: '모든 사람은 저마다의 개성을 가진 별이라고 생각했어요. 각자의 빛은 다르지만 모두 소중하니까요.',
      section2Title: '관계가 그려지는 별자리',
      section2Text: '사람 사이의 마음과 관계를 어둠속에 두고 싶지 않았어요. 그래서 별을 주고 받고, 그 별과 별을 이어, 감정을 별자리로 시각화하는 서비스를 개발했어요.',
      devHistory: '서비스 개발 히스토리',
      notice: '공지사항',
      viewAll: '전체보기',
      noNotice: '공지사항이 없습니다.',
      tableNo: '번호',
      tableTitle: '제목',
      tableDate: '작성일',
      important: '중요',
    },

    // Stars 페이지 (별 보관소)
    stars: {
      title: '님의 별 보관소',
      receivedStars: '개의 별을 선물 받았어요!',
      starFrom: 'from.',
      sentStar: '님이 보낸 별',
      viewAllAnswers: '전체 답변 보기',
      deleteWarning: '한 번 삭제한 별은',
      deleteWarning2: '복구할 수 없습니다.',
      deleteConfirm: '정말 삭제하시겠습니까?',
      delete: '삭제',
      deleteFailed: '별 삭제에 실패했습니다.',
      shareAndGet: '링크 공유하고',
      getStar: '별 선물받기',
      nightSky: '님의 밤하늘',
    },

    // Home 페이지 (밤하늘)
    home: {
      title: '님의 밤하늘',
      loginRequired: '로그인이 필요합니다.',
      linkCopied: '링크가 복사되었습니다!',
      imageSaved: '이미지가 저장되었습니다!',
      imageSaveFailed: '이미지 저장에 실패했습니다.',
      saving: '저장 중...',
      constellationName: 'ABCD한 EFGE자리',
      constellationImage: '별자리 커스텀 이미지',
      goodMatch: '궁합 좋은',
      badMatch: '궁합 안 좋은',
      constellation: '별자리',
      aiRename: 'AI 별자리 이름 바꾸기',
      tutorial: {
        step1Title: '별 잇기',
        step1Desc: '별과 별을 드래그해 선을 이으세요.',
        step2Title: '선 삭제하기',
        step2Desc: '선을 가로질러 드래그해 선을 삭제하세요.',
        step3Title: '별 이동하기',
        step3Desc: '별을 길게 눌러 위치를 이동하세요.',
        step4Title: '저장하기',
        step4Save: '저장',
        step4SaveDesc: '내 밤하늘 꾸미기 저장',
        step4Capture: '사진을 갤러리에 저장',
        step4Link: '내 밤하늘 링크 복사',
      },
    },

    // Stat 페이지 (통계)
    stat: {
      title: '님의 대표별',
      whatStar: '어떤 별일까요?',
      participants: '명이 모여',
      makingStar: '님의 별을',
      makingStar2: '만들고있어요!',
      viewStats: '질문별 통계보기',
    },

    // Warehouse 페이지 (별 보관함)
    warehouse: {
      title: '별 보관함',
      moveToSky: '밤하늘로 보내기',
      emptyWarehouse: '보관함이 비어있어요',
      noStarsInWarehouse: '아직 보관함에 별이 없습니다.',
      maxStarsAlert: '밤하늘에는 최대',
      maxStarsAlert2: '개의 별만 등록할 수 있습니다.',
      saveFailed: '저장에 실패했습니다.',
    },

    // Notice 페이지
    notice: {
      title: '공지사항',
      noNotices: '공지사항이 없습니다.',
    },

    // Signup 페이지
    signup: {
      // Step navigation
      prev: '← 이전',
      next: '다음 →',
      stepOf: '/5',

      // Step 1 - 기본 정보
      email: '아이디',
      password: '비밀번호',
      passwordConfirm: '비밀번호 확인',
      phone: '휴대전화',
      phonePlaceholder: '010-1234-5678',
      verificationCode: '인증번호 6자리',
      sendVerification: '인증하기',
      sending: '발송 중...',
      verifying: '확인 중...',
      verify: '확인',
      verified: '완료',
      verificationComplete: '✓ 인증이 완료되었습니다.',
      privacyAgreement: '개인정보 수집 및 활용 동의(필수)',
      agree: '동의합니다',

      // Step 2 - 환영
      profileSetup: '프로필 설정',
      welcomeSubtitle: '나를 닮은 별자리,',
      welcomeTitle: 'Starry에 오신걸 환영해요!',

      // Step 3 - 닉네임
      enterNickname: '이름 또는 닉네임을',
      enterNickname2: '입력해주세요!',
      nicknamePlaceholder: '행복한별과',

      // Step 4 - 생년월일
      birthdayQuestion: '생일은 언제인가요?',
      selectYear: '년도 선택',
      selectMonth: '월 선택',
      selectDay: '일 선택',
      year: '년',
      month: '월',
      day: '일',
      signingUp: '가입 중...',

      // Step 5 - 완료
      signupComplete: '가입이 완료되었어요!',
      linkSNS: 'SNS 연동하기',
      goToNightSky: '밤하늘 만들러가기',

      // Error messages
      emailDuplicate: '이미 가입된 이메일입니다.',
      phoneDuplicate: '이미 가입된 전화번호입니다.',
      phoneInvalid: '올바른 전화번호를 입력해주세요.',
      phoneCheckError: '전화번호 확인 중 오류가 발생했습니다.',
      verificationExpired: '인증번호가 만료되었습니다. 다시 요청해주세요.',
      verificationSent: '인증번호가 발송되었습니다.',
      verificationCodeInvalid: '인증번호 6자리를 입력해주세요.',
      verificationFailed: '인증번호가 일치하지 않습니다.',
      phoneVerificationComplete: '휴대전화 인증이 완료되었습니다.',
      phoneVerificationRequired: '휴대전화 인증을 완료해주세요.',
      privacyRequired: '개인정보 수집 및 활용에 동의해주세요.',
      passwordMismatch: '비밀번호가 일치하지 않습니다.',
      passwordTooShort: '비밀번호는 최소 6자 이상이어야 합니다.',
      nicknameRequired: '닉네임을 입력해주세요.',
      signupFailed: '회원가입에 실패했습니다.',
      smsFailed: 'SMS 발송에 실패했습니다.',
      snsComingSoon: 'SNS 연동 기능은 추후 업데이트 예정입니다.',
    },
  },

  en: {
    // Common
    common: {
      login: 'Login',
      logout: 'Logout',
      signup: 'Sign Up',
      next: 'Next',
      prev: 'Back',
      send: 'Send',
      sending: 'Sending...',
      save: 'Save',
      cancel: 'Cancel',
      change: 'Change',
      changing: 'Changing...',
      loading: 'Loading...',
      copyLink: 'Copy Link',
      linkCopied: 'Link copied.',
      korean: '한국어',
      english: 'English',
    },

    // Loading/Login Page
    loading: {
      subtitle: 'Your unique constellation',
      email: 'Email',
      password: 'Password',
      loggingIn: 'Logging in...',
      simpleLogin: 'Quick Login',
      findEmail: 'Find Email',
      findPassword: 'Find Password',
      googleLogin: 'Google Login',
      kakaoLogin: 'Kakao Login (Coming Soon)',
      invalidCredentials: 'Invalid email or password.',
      loginFailed: 'Login failed.',
      devLogin: 'Dev Login',
    },

    // User Page
    user: {
      personalSettings: "'s Settings",
      userId: 'ID',
      nickname: 'Nickname',
      phone: 'Phone',
      password: 'Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      enterNewPassword: 'Please enter a new password.',
      passwordMismatch: 'New passwords do not match.',
      passwordTooShort: 'Password must be at least 6 characters.',
      passwordChanged: 'Password changed successfully.',
      passwordChangeFailed: 'Failed to change password.',
      enterNickname: 'Please enter a nickname.',
      nicknameTooShort: 'Nickname must be at least 2 characters.',
      nicknameTooLong: 'Nickname must be 10 characters or less.',
      nicknameChanged: 'Nickname changed.',
      nicknameChangeFailed: 'Failed to change nickname.',
      socialAccount: 'Social Account Links',
      notLinked: 'Not linked',
      preparing: 'Coming Soon',
      googleCannotUnlink: 'Cannot unlink account signed up with Google.',
      linkInfoNotFound: 'Link info not found.',
      unlinkConfirm: 'Unlink Google account?',
      googleUnlinked: 'Google account unlinked.',
      googleLinkFailed: 'Failed to link Google account.',
      googleUnlinkFailed: 'Failed to unlink Google account.',
      languageSetting: 'Language',
      myQRCode: 'My Night Sky QR Code',
      loginRequired: 'Login Required',
    },

    // Survey Start Page
    surveyStart: {
      giftStar: 'Gift a star to their night sky!',
      enterName: 'Enter your name',
      pleaseEnterName: 'Please enter your name.',
      notice1: '* Your name cannot be changed once entered.',
      notice2: "* Please enter carefully and click 'Next'.",
    },

    // Survey Questions Page
    survey: {
      questions: [
        {
          questionLine1: (nickname) => `What does ${nickname}`,
          questionLine2: 'value the most?',
          options: [
            { label: 'Challenge!', description: 'Push forward bravely' },
            { label: 'Skill!', description: 'Get it done right' },
            { label: 'Knowledge!', description: 'Discover new things' },
            { label: 'Heart!', description: 'Work together with people' },
          ],
        },
        {
          questionLine1: (nickname) => `${nickname}'s`,
          questionLine2: 'behavior style in new situations?',
          options: [
            { label: 'Leader!', description: 'I take the lead' },
            { label: 'Consistent!', description: 'Stick to my ways' },
            { label: 'Flexible!', description: 'Adapt to situations' },
            { label: 'Mediator!', description: "Hear everyone's opinion" },
          ],
        },
        {
          questionLine1: (nickname) => `${nickname}'s`,
          questionLine2: 'first impression?',
          options: [
            { label: 'Outgoing!', description: 'Energetic vibe' },
            { label: 'Reserved!', description: 'Calm and thoughtful' },
            { label: 'Balanced!', description: 'Friendly and easy-going' },
            { label: 'Unique!', description: 'Unpredictable' },
          ],
        },
        {
          questionLine1: (nickname) => `When is ${nickname}`,
          questionLine2: 'the happiest?',
          options: [
            { label: 'When leveling up', description: 'in games' },
            { label: 'When discovering', description: 'fun secrets' },
            { label: 'When praised', description: 'for hard work' },
            { label: 'When going', description: 'to cafes with friends' },
          ],
        },
        {
          questionLine1: (nickname) => `How does ${nickname}`,
          questionLine2: 'relieve stress?',
          options: [
            { label: 'Eat delicious food', description: 'or sleep well' },
            { label: 'Talk to', description: 'close friends' },
            { label: 'Exercise or', description: 'sing songs' },
            { label: 'Analyze the', description: 'cause of stress' },
          ],
        },
      ],
      starCompleted: 'Your star for',
      starCompletedLine2: 'is complete!',
      receivedStar1: '',
      receivedStar2: ' received the star',
      receivedStar3: ' gifted!',
      viewNightSky: "'s Night Sky",
      createMyNightSky: 'Create My Night Sky',
      nightSky: "'s Night Sky",
      sendFailed: 'Failed to send star. Please try again.',
    },

    // Footer
    footer: {
      adInquiry: 'Ad Inquiry',
      otherInquiry: 'Other Inquiry',
      copyright: 'Copyright ©2025 123456789. All rights reserved.',
      developer: 'Developer',
      designer: 'Designer',
    },

    // Starry Page (About)
    starry: {
      title: "Starry's Story",
      section1Title: 'Everyone is a Star',
      section1Text: 'We believe everyone is a unique star with their own personality. Each shines differently, but all are precious.',
      section2Title: 'Constellations of Relationships',
      section2Text: "We didn't want to leave people's hearts and relationships in the dark. So we created a service to exchange stars, connect them, and visualize emotions as constellations.",
      devHistory: 'Development History',
      notice: 'Notices',
      viewAll: 'View All',
      noNotice: 'No notices available.',
      tableNo: 'No.',
      tableTitle: 'Title',
      tableDate: 'Date',
      important: 'Important',
    },

    // Stars Page (Star Collection)
    stars: {
      title: "'s Star Collection",
      receivedStars: ' stars received!',
      starFrom: 'from.',
      sentStar: ' sent this star',
      viewAllAnswers: 'View All Answers',
      deleteWarning: 'Once deleted,',
      deleteWarning2: 'stars cannot be recovered.',
      deleteConfirm: 'Are you sure you want to delete?',
      delete: 'Delete',
      deleteFailed: 'Failed to delete star.',
      shareAndGet: 'Share link and',
      getStar: 'receive stars',
      nightSky: "'s Night Sky",
    },

    // Home Page (Night Sky)
    home: {
      title: "'s Night Sky",
      loginRequired: 'Login required.',
      linkCopied: 'Link copied!',
      imageSaved: 'Image saved!',
      imageSaveFailed: 'Failed to save image.',
      saving: 'Saving...',
      constellationName: 'My Constellation',
      constellationImage: 'Custom constellation image',
      goodMatch: 'Good match',
      badMatch: 'Bad match',
      constellation: 'Constellation',
      aiRename: 'AI Rename Constellation',
      tutorial: {
        step1Title: 'Connect Stars',
        step1Desc: 'Drag between stars to draw lines.',
        step2Title: 'Delete Lines',
        step2Desc: 'Drag across a line to delete it.',
        step3Title: 'Move Stars',
        step3Desc: 'Long press a star to move it.',
        step4Title: 'Save',
        step4Save: 'Save',
        step4SaveDesc: 'Save my night sky design',
        step4Capture: 'Save photo to gallery',
        step4Link: 'Copy my night sky link',
      },
    },

    // Stat Page (Statistics)
    stat: {
      title: "'s Star Profile",
      whatStar: 'What kind of star are you?',
      participants: ' people are helping',
      makingStar: 'create ',
      makingStar2: "'s star!",
      viewStats: 'View Statistics',
    },

    // Warehouse Page
    warehouse: {
      title: 'Star Warehouse',
      moveToSky: 'Move to Night Sky',
      emptyWarehouse: 'Warehouse is empty',
      noStarsInWarehouse: 'No stars in warehouse yet.',
      maxStarsAlert: 'You can only add up to',
      maxStarsAlert2: 'stars to your night sky.',
      saveFailed: 'Failed to save.',
    },

    // Notice Page
    notice: {
      title: 'Notices',
      noNotices: 'No notices available.',
    },

    // Signup Page
    signup: {
      // Step navigation
      prev: '← Back',
      next: 'Next →',
      stepOf: '/5',

      // Step 1 - Basic Info
      email: 'Email',
      password: 'Password',
      passwordConfirm: 'Confirm Password',
      phone: 'Phone',
      phonePlaceholder: '010-1234-5678',
      verificationCode: '6-digit code',
      sendVerification: 'Verify',
      sending: 'Sending...',
      verifying: 'Verifying...',
      verify: 'Verify',
      verified: 'Done',
      verificationComplete: '✓ Verification complete.',
      privacyAgreement: 'Privacy Policy Agreement (Required)',
      agree: 'I agree',

      // Step 2 - Welcome
      profileSetup: 'Profile Setup',
      welcomeSubtitle: 'Your unique constellation,',
      welcomeTitle: 'Welcome to Starry!',

      // Step 3 - Nickname
      enterNickname: 'Enter your name',
      enterNickname2: 'or nickname!',
      nicknamePlaceholder: 'HappyStar',

      // Step 4 - Birthday
      birthdayQuestion: 'When is your birthday?',
      selectYear: 'Select Year',
      selectMonth: 'Select Month',
      selectDay: 'Select Day',
      year: 'Year',
      month: 'Month',
      day: 'Day',
      signingUp: 'Signing up...',

      // Step 5 - Complete
      signupComplete: 'Sign up complete!',
      linkSNS: 'Link SNS Account',
      goToNightSky: 'Create My Night Sky',

      // Error messages
      emailDuplicate: 'This email is already registered.',
      phoneDuplicate: 'This phone number is already registered.',
      phoneInvalid: 'Please enter a valid phone number.',
      phoneCheckError: 'Error checking phone number.',
      verificationExpired: 'Verification code expired. Please request again.',
      verificationSent: 'Verification code sent.',
      verificationCodeInvalid: 'Please enter a 6-digit code.',
      verificationFailed: 'Verification code does not match.',
      phoneVerificationComplete: 'Phone verification complete.',
      phoneVerificationRequired: 'Please complete phone verification.',
      privacyRequired: 'Please agree to the privacy policy.',
      passwordMismatch: 'Passwords do not match.',
      passwordTooShort: 'Password must be at least 6 characters.',
      nicknameRequired: 'Please enter a nickname.',
      signupFailed: 'Sign up failed.',
      smsFailed: 'Failed to send SMS.',
      snsComingSoon: 'SNS linking will be available soon.',
    },
  },
};

// 번역 함수
export const t = (translations, language, key) => {
  const keys = key.split('.');
  let value = translations[language];

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // 번역을 찾지 못하면 키 반환
    }
  }

  return value || key;
};
