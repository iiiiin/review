// src/data/landingPageData.ts

export const featuresData = [
  {
    imgSrc: '/interview1.png',
    alt: '두 사람이 마주앉아 진지하게 대화하는 인성 면접 모습',
    title: '인성 면접',
    description:
      '나만의 스토리를 설득력 있게 전달하세요. 체계적인 답변 가이드로 논리적인 답변을 만들고, AI가 표정과 목소리까지 분석해 신뢰감 있는 태도를 완성합니다.',
    modalContent: {
      title: '인성 면접',
      leftContent: {
        title: '인성 면접이란?',
        description: '지원자의 가치관, 성격, 조직 적합성을 평가하는 면접입니다.',
        points: [
          '자신의 장단점과 성장 경험을 묻습니다',
          '갈등 상황에서의 대처 방식을 확인합니다', 
          '팀워크와 협업 능력을 평가합니다',
          '회사 문화와의 적합성을 판단합니다'
        ]
      },
      rightContent: {
        title: 'Re:View에서는?',
        description: '개인 맞춤형 AI 코칭으로 완벽한 인성 면접을 준비하세요.',
        points: [
          '업로드한 이력서를 바탕으로 나만의 맞춤 질문 자동 생성',
          '상황-행동-결과 순서로 체계적인 답변 작성 가이드',
          '표정, 시선, 목소리 톤까지 실시간 AI 분석',
          '첫 질문 후 추가 질문 2개로 실전감각 강화',
          '부족한 부분을 콕 짚어주는 개인별 개선점 제시',
          '같은 질문으로 반복 연습하며 완벽해질 때까지'
        ]
      }
    }
  },
  {
    imgSrc: '/interview3.png',
    alt: '개발자가 노트북을 앞에 두고 기술 면접을 준비하는 모습',
    title: '직무 면접',
    description:
      '복잡한 개념도 명확하게 설명하세요. 직무별 맞춤 질문으로 실무 능력을 훈련하고, AI가 논리성과 전문성을 분석해 확실한 어필을 도와드립니다.',
    modalContent: {
      title: '직무 면접',
      leftContent: {
        title: '직무 면접이란?',
        description: '지원하는 직무에 필요한 전문 지식과 실무 능력을 평가하는 면접입니다.',
        points: [
          '업무와 직접 관련된 전문 지식을 묻습니다',
          '실제 상황을 가정한 문제 해결 능력을 확인합니다',
          '과거 경험과 성과를 구체적으로 설명하게 합니다',
          '해당 분야의 트렌드와 이해도를 평가합니다'
        ]
      },
      rightContent: {
        title: 'Re:View에서는?',
        description: '실전과 동일한 환경에서 전문성을 완벽하게 어필하세요.',
        points: [
          '내 직무에 딱 맞는 문제로 실무 능력 집중 훈련',
          '포트폴리오를 보고 나만의 맞춤 질문 자동 생성',
          '문제 푸는 과정이 논리적인지 실시간으로 체크',
          '전문 용어를 제대로 쓰고 있는지 확신도까지 측정',
          '쉬운 문제부터 어려운 문제까지 단계별 연습',
          '내가 어떻게 설명했는지 다시 보며 완벽하게 연마'
        ]
      }
    }
  },
  {
    imgSrc: '/interview2.png',
    alt: '한 사람이 차트가 띄워진 화면 앞에서 발표하는 모습',
    title: 'PT 면접',
    description:
      '당당하고 자신감 넘치는 발표자가 되세요. 체계적인 발표 구조로 흐름을 잡고, AI가 시선과 제스처까지 분석해 청중을 사로잡는 프레젠테이션 스킬을 완성합니다.',
    modalContent: {
      title: 'PT 면접',
      leftContent: {
        title: 'PT 면접이란?',
        description: '발표자료를 바탕으로 아이디어를 발표하고 질의응답하는 면접입니다.',
        points: [
          '기획력과 논리적 사고 능력을 검증합니다',
          '프레젠테이션 스킬과 전달력을 평가합니다',
          '청중과의 소통 능력을 확인합니다',
          '돌발 질문에 대한 대응력을 봅니다'
        ]
      },
      rightContent: {
        title: 'Re:View에서는?',
        description: '화면 공유 발표부터 질의응답까지 완벽하게 준비하세요.',
        points: [
          '발표자료 업로드로 실제 PT 환경 그대로 구현',
          '관심 끄는 시작부터 강력한 마무리까지 발표 구조 완성',
          '눈맞춤, 손짓, 말하는 속도까지 실시간으로 세밀하게 분석',
          '나에게 올 수 있는 질문들을 미리 준비하고 연습',
          '몇 분에 뭘 말할지 시간 배분까지 완벽하게 가이드',
          '발표하는 모습을 다시 보며 부족한 점 하나씩 개선'
        ]
      }
    }
  }
];



export const howToSectionsData = [
  {
    title: "간편한 설정",
    subtitle: "원하는 면접 유형 선택과 맞춤 환경 구성",
    description:
      "인성·직무·PT 면접 중 하나를 선택하고, 지원하는 회사와 직무를 입력해주세요. 이력서나 포트폴리오를 업로드하면 나만의 맞춤형 질문이 만들어집니다. 간단한 장비 테스트로 준비 완료!",
    imageUrl:
      "https://images.unsplash.com/photo-1516542076529-1ea3854896f2?q=80&w=2071&auto=format&fit=crop",
    imageAlt: "면접 준비를 위해 노트북과 서류가 놓인 책상 이미지",
    imagePosition: 'right' as const
  },
  {
    title: "실전 면접 진행",
    subtitle: "실제 면접관과 마주한 것처럼 생생하게",
    description:
      "고화질 화상으로 실제 면접처럼 진행합니다. AI 면접관이 질문하면 편안하게 답변해보세요. 본질문에 이어 꼬리질문까지 자연스럽게 연결되며, 당신의 표정과 시선, 목소리까지 꼼꼼히 분석해 실전감각을 키워드립니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2400&auto=format&fit=crop",
    imageAlt: "정장을 입은 지원자가 웹캠을 응시하며 화상 면접을 진행하는 장면",
    imagePosition: 'left' as const
  },
  {
    title: "상세한 분석 결과",
    subtitle: "면접 직후 바로 확인하는 맞춤 피드백",
    description:
      "면접이 끝나자마자 상세한 분석 결과를 받아보세요. 질문별 점수부터 감정 변화, 말하는 습관까지 한눈에 파악할 수 있습니다. 부족한 부분은 재도전으로 완벽하게 준비하세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
    imageAlt: "다양한 데이터 분석 그래프가 보이는 화면 이미지",
    imagePosition: 'right' as const
  }
];



export const testimonialsData = [
  {
    quote: "3번의 연습으로 신입 개발자에 합격했어요. 표정 관리 피드백이 정말 도움됐습니다.",
    author: "박희재",
    title: "신입 개발자",
    avatar: "/avatars/user1.jpg"
  },
  {
    quote: "AI 피드백을 따라 고쳤더니 실제 면접에서 좋은 인상을 줬어요.",
    author: "권인",
    title: "개발자 취업준비생",
    avatar: "/avatars/user2.jpg"
  },
  {
    quote: `PT 면접 연습으로 태도를 교정했어요. 실제 면접에서 자신감 있게 발표했습니다.`,
    author: "김민석",
    title: "프로덕트 매니저",
    avatar: "/avatars/user3.jpg"
  },
  {
    quote: "갈등상황 질문 연습이 효과적이었어요. 실제 면접에서 그대로 활용했습니다.",
    author: "최민석",
    title: "백엔드 개발자",
    avatar: "/avatars/user4.jpg"
  },
  {
    quote: "반복 연습 후 답변 시간이 30% 줄었어요. 핵심만 전달하는 법을 배웠습니다.",
    author: "이아현",
    title: "백엔드 개발자",
    avatar: "/avatars/user5.jpg"
  },
  {
    quote: "AI 답변 분석으로 말하는 습관을 고쳤어요. 면접관이 '설명을 잘한다'고 하셨습니다.",
    author: "이희산",
    title: "백엔드 개발자",
    avatar: "/avatars/user6.jpg"
  }
];

export const heroSlidesData = [
  {
    title: 'AI 면접, 합격의 지름길',
    subtitle: 'AI 기반 개인 맞춤형 코칭으로 완벽한 면접 준비',
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2069&auto=format&fit=crop',
  },
  {
    title: '실전처럼 연습하고, 전문가처럼 분석받으세요',
    subtitle: '실시간 표정, 목소리, 제스처 분석으로 개선점을 찾아보세요',
    imageUrl: 'https://images.unsplash.com/photo-1556742212-5b321f3c261b?q=80&w=2070&auto=format&fit=crop',
  },
  {
    title: '당신의 잠재력을 깨우는 시간',
    subtitle: '체계적인 질문과 답변 관리로 면접 자신감을 높여보세요',
    imageUrl: 'https://images.unsplash.com/photo-1573496130407-57329f01f769?q=80&w=2069&auto=format&fit=crop',
  },
];

export const sectionDetails = [
    { id: 'hero', label: '소개' },
    { id: 'features', label: '주요 기능' },
    { id: 'how-to', label: '사용 방법' },
    { id: 'testimonials', label: '사용자 후기' },
    { id: 'cta-section', label: '시작하기' },
];

export const interviewTags = ['#기술면접', '#인성면접', '#신입', '#경력', '#외국계', '#IT/개발'];