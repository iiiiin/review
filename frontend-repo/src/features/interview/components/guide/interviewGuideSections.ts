import { Camera, ShieldCheck, Lightbulb, Settings } from 'lucide-react';
import React from 'react';

interface GuideSection {
  icon: React.ElementType;
  title: string;
  items: string[];
}

export const guideSections: GuideSection[] = [
  {
    icon: Camera,
    title: '장비 및 환경 준비',
    items: [
      '카메라와 마이크 권한을 허용해주세요. 아래 장비 테스트에서 정상 작동을 확인하세요.',
      '조용하고 밝은 장소에서 진행하며, 얼굴이 화면 중앙에 잘 보이도록 조정하세요.',
      '안정적인 인터넷 연결을 확인하고, 다른 프로그램은 종료해주세요.',
      '면접 중 알림이나 방해를 받지 않도록 휴대폰을 무음 모드로 설정하세요.',
    ],
  },
  {
    icon: Settings,
    title: 'AI 면접 진행 방식',
    items: [
      '"답변 시작" 버튼을 누르면 녹화가 시작되고, AI가 실시간으로 답변을 분석합니다.',
      '답변 완료 후 "다음 질문으로" 버튼을 누르거나, 시간이 다 되면 자동으로 넘어갑니다.',
      '꼬리질문이 있을 경우 연속으로 진행되며, 한 세트가 끝나면 잠시 결과를 확인할 수 있습니다.',
      '만족스럽지 않은 답변이 있다면 "리트라이" 기능을 이용해 해당 질문들을 다시 답변할 수 있습니다.',
    ],
  },
  {
    icon: ShieldCheck,
    title: '면접 진행 주의사항',
    items: [
      '질문당 답변 시간은 60초이며, 화면에 남은 시간이 표시됩니다.',
      '녹화가 진행되는 동안 화면에 "녹화중" 표시가 나타납니다.',
    ],
  },
  {
    icon: Lightbulb,
    title: '좋은 답변을 위한 팁',
    items: [
      '상황-과제-행동-결과 순서로 구체적인 경험을 들어 답변하세요.',
      '처음 10초 안에 핵심 내용을 말하고, 실제 경험 사례로 설명해주세요.',
      '카메라를 보며 명확하고 자신감 있게 말하세요.',
      'PT 면접에서는 논리적인 순서로 말하고, 마지막에 결론을 확실히 정리하세요.',
    ],
  },
];
