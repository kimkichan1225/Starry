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
      confirm: '확인',
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
      kakaoLogin: '카카오 로그인',
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
      googleCannotUnlink: '구글로 가입한 계정은 연동을 해제할 수 없습니다.',
      linkInfoNotFound: '연동 정보를 찾을 수 없습니다.',
      unlinkConfirm: '구글 연동을 해제하시겠습니까?',
      googleUnlinked: '구글 연동이 해제되었습니다.',
      googleLinkFailed: '구글 연동에 실패했습니다.',
      googleUnlinkFailed: '구글 연동 해제에 실패했습니다.',
      kakaoCannotUnlink: '카카오로 가입한 계정은 연동을 해제할 수 없습니다.',
      kakaoUnlinkConfirm: '카카오 연동을 해제하시겠습니까?',
      kakaoUnlinked: '카카오 연동이 해제되었습니다.',
      kakaoLinkFailed: '카카오 연동에 실패했습니다.',
      kakaoUnlinkFailed: '카카오 연동 해제에 실패했습니다.',
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

    // 웰컴(마케팅) 페이지
    welcome: {
      title: '오늘의 운세를 확인하세요!',
      enterName: '이름을 입력하세요.',
      pleaseEnterName: '이름을 입력해주세요.',
      nameHint: '* 이름 또는 닉네임을 입력해주세요.',
      fortuneLoading: '오늘의 운세 읽는 중',
      nextLabel: '다음으로',
      sameFortuneSuffix: '명과',
      sameFortuneTitle2: '같은 운세에요!',
      result2Body1: (name) => `하지만 세상에 똑같은 사람이 없듯, ${name}님이 오늘을 대하는 마음도 남들과는 분명 다를 거예요.`,
      result2Body2: '성격과 인간관계까지 종합한 진짜 운세를 확인하려면?',
      result2Body3: 'STARRY에서 별자리와 성격 조합한 나만의 운세를 확인하세요.',
      findRealFortune: '내 진짜 운세 알아보기',
    },

    // 설문 질문 페이지
    survey: {
      questions: [
        {
          questionLine1: (nickname) => `무인도에 떨어진 ${nickname} 님,`,
          questionLine2: () => '가장 먼저 챙길 것은?',
          options: [
            { label: '탈출할 배를 만드는', description: '용기' },
            { label: '사냥을 성공시키는', description: '생존 기술' },
            { label: '식물 독성을 구별하는', description: '지식' },
            { label: '동료들을 멘탈 케어하는', description: '마음' },
          ],
        },
        {
          questionLine1: () => '조별과제 팀장이 탈주했다!',
          questionLine2: (nickname) => `이때 ${nickname} 님은?`,
          options: [
            { label: '"내가 할게"', description: '냅다 팀장 맡기' },
            { label: '팀장 없어도', description: '내 할 일만 하기' },
            { label: '"오히려 좋아"', description: '주제 갈아엎기' },
            { label: '싸우지 않게', description: '팀원들 달래기' },
          ],
        },
        {
          questionLine1: () => '처음 만난 술자리에서',
          questionLine2: (nickname) => `${nickname} 님의 포지션은?`,
          options: [
            { label: '처음 본 사람과', description: '베프 먹기' },
            { label: '말 걸어줄 때까지', description: '폰 보기' },
            { label: '눈 마주치면', description: '어색하게 웃기' },
            { label: '세상 튀는 옷 입고', description: '존재감 뿜기' },
          ],
        },
        {
          questionLine1: (nickname) => `${nickname} 님의 심장박동수가`,
          questionLine2: () => '가장 빨라지는 순간은?',
          options: [
            { label: '연승 직전', description: '한타 싸움할 때' },
            { label: '"너만 알아라"', description: '비밀 들었을 때' },
            { label: '사람들 앞에서', description: '극찬받을 때' },
            { label: '밤새 수다 떨며', description: '연애 썰 풀 때' },
          ],
        },
        {
          questionLine1: () => '상사한테 영혼까지 털린 날,',
          questionLine2: (nickname) => `${nickname} 님의 퇴근길은?`,
          options: [
            { label: '엽떡 시키고', description: '침대로 직행' },
            { label: '전화로 쌍욕 하며', description: '한풀이' },
            { label: '코노 가서', description: '고음 지르기' },
            { label: '"내가 왜 털렸지?"', description: '원인 분석' },
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

    // 오늘의 운세
    fortune: {
      title: '오늘의 운세',
      love: '애정운',
      health: '건강운',
      wealth: '재물운',
      luckyItem: '행운 아이템',
      more: '더보기',
      collapse: '접기',
      basedOn: '생년월일 기반으로 생성된 오늘의 운세입니다.',
      noBirthdate: '생년월일을 등록하면 오늘의 운세를 확인할 수 있어요.',
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
      pageTutorial: {
        step1: '친구, 가족, 연인 등\n나를 아는 사람들에게\n',
        step1Bold: '링크를 공유해요!',
        step2: '선물받은 별들을 모아\n내 밤하늘에\n',
        step2Bold: '별자리를 만들어요!',
        step3: 'SNS에 별자리를 공유하고\n내 별자리 속\n',
        step3Bold: '의미를 해석해요!',
        close: '닫기',
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
      linkGoogle: '구글 연동하기',
      linkKakao: '카카오 연동하기',
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
      confirm: 'Confirm',
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
      kakaoLogin: 'Kakao Login',
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
      googleCannotUnlink: 'Cannot unlink account signed up with Google.',
      linkInfoNotFound: 'Link info not found.',
      unlinkConfirm: 'Unlink Google account?',
      googleUnlinked: 'Google account unlinked.',
      googleLinkFailed: 'Failed to link Google account.',
      googleUnlinkFailed: 'Failed to unlink Google account.',
      kakaoCannotUnlink: 'Cannot unlink account signed up with Kakao.',
      kakaoUnlinkConfirm: 'Unlink Kakao account?',
      kakaoUnlinked: 'Kakao account unlinked.',
      kakaoLinkFailed: 'Failed to link Kakao account.',
      kakaoUnlinkFailed: 'Failed to unlink Kakao account.',
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

    // Welcome (marketing) Page
    welcome: {
      title: "Check today's fortune!",
      enterName: 'Enter your name.',
      pleaseEnterName: 'Please enter your name.',
      nameHint: '* Please enter your name or nickname.',
      fortuneLoading: "Reading today's fortune",
      nextLabel: 'Next',
      sameFortuneSuffix: 'people',
      sameFortuneTitle2: 'share this fortune!',
      result2Body1: (name) => `But just as no two people are alike, the way ${name} faces today will surely differ from others.`,
      result2Body2: 'Want to see the real fortune that includes personality and relationships?',
      result2Body3: 'Check your unique fortune combined with your constellation and personality at STARRY.',
      findRealFortune: 'See my real fortune',
    },

    // Survey Questions Page
    survey: {
      questions: [
        {
          questionLine1: () => 'Stranded on a desert island,',
          questionLine2: (nickname) => `what does ${nickname} grab first?`,
          options: [
            { label: 'Courage', description: 'to build a raft' },
            { label: 'Skills', description: 'to hunt for food' },
            { label: 'Knowledge', description: 'of toxic plants' },
            { label: 'Heart', description: 'to care for the team' },
          ],
        },
        {
          questionLine1: () => 'The group leader bailed!',
          questionLine2: (nickname) => `What does ${nickname} do?`,
          options: [
            { label: "I'll lead", description: 'take charge' },
            { label: 'My part', description: 'leader or not' },
            { label: 'Even better', description: 'redo it all' },
            { label: 'Keep peace', description: 'calm everyone' },
          ],
        },
        {
          questionLine1: () => 'At a party full of strangers,',
          questionLine2: (nickname) => `what's ${nickname}'s role?`,
          options: [
            { label: 'Instant besties', description: 'with strangers' },
            { label: 'On my phone', description: 'till spoken to' },
            { label: 'Shy smile', description: 'when eyes meet' },
            { label: 'Bold outfit', description: 'all eyes on me' },
          ],
        },
        {
          questionLine1: (nickname) => `When does ${nickname}'s heart`,
          questionLine2: () => 'beat the fastest?',
          options: [
            { label: 'Clutch teamfight', description: 'before a win' },
            { label: 'A secret', description: 'just for me' },
            { label: 'Praised', description: 'in the spotlight' },
            { label: 'Cafe talk', description: 'love stories' },
          ],
        },
        {
          questionLine1: () => 'After a brutal day at work,',
          questionLine2: (nickname) => `what's ${nickname}'s way home?`,
          options: [
            { label: 'Eat & crash', description: 'straight to bed' },
            { label: 'Vent it out', description: 'on the phone' },
            { label: 'Karaoke', description: 'belt high notes' },
            { label: 'Why me?', description: 'analyze the cause' },
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

    // Today's Fortune
    fortune: {
      title: "Today's Fortune",
      love: 'Love',
      health: 'Health',
      wealth: 'Wealth',
      luckyItem: 'Lucky Item',
      more: 'More',
      collapse: 'Collapse',
      basedOn: "Today's fortune generated based on your birthdate.",
      noBirthdate: 'Register your birthdate to see your daily fortune.',
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
      pageTutorial: {
        step1: 'Share your link with\nfriends, family, and\nloved ones who know you!\n',
        step1Bold: 'Share the link!',
        step2: 'Collect the gifted stars\nand create\n',
        step2Bold: 'constellations in your sky!',
        step3: 'Share constellations on SNS\nand interpret the\n',
        step3Bold: 'meaning of your stars!',
        close: 'Close',
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
      linkGoogle: 'Link Google',
      linkKakao: 'Link Kakao',
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
