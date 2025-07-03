# 🎹 PianoAI Coach

AI 기반 피아노 연주 분석 및 비교 도구

## ✨ 주요 기능

- 🎵 **음원/동영상 업로드**: MP3, WAV, MP4 등 다양한 형식 지원
- 🔍 **AI 음원 분석**: 실시간 주파수, 템포, 음색 분석
- 🎤 **연주 녹음**: 마이크를 통한 실시간 연주 녹음
- 📊 **AI 비교 분석**: 원본과 연주의 음정, 리듬, 음색 비교
- ⭐ **점수 시스템**: 정확도 기반 점수 및 등급 제공

## 🚀 빠른 시작

### 1. 로컬 서버 실행
```bash
# Python 사용
python -m http.server 8000

# 또는 Node.js live-server 사용
npm install -g live-server
live-server --port=8080
```

### 2. 브라우저에서 접속
```
http://localhost:8000
```

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Audio**: Web Audio API, Tone.js
- **AI**: Claude API 연동
- **UI**: 반응형 디자인, 글래스모피즘

## 📁 프로젝트 구조

```
piano-ai-coach/
├── index.html          # 메인 HTML 파일
├── css/
│   └── styles.css      # 스타일시트
├── js/
│   ├── audio-analyzer.js   # 오디오 분석 클래스
│   ├── ai-comparison.js    # AI 비교 로직
│   └── utils.js           # 유틸리티 함수들
└── assets/
    └── icons/             # 아이콘 및 이미지
```

## 🎯 사용 방법

1. **파일 업로드**: 음원 또는 동영상 파일을 드래그앤드롭
2. **AI 분석**: 업로드된 파일의 음향 특성 자동 분석
3. **연주 녹음**: 마이크로 연주 녹음 또는 파일 업로드
4. **결과 확인**: AI가 분석한 비교 결과 및 점수 확인

## 🔧 개발 가이드

### 주요 클래스
- `AudioAnalyzer`: 메인 오디오 처리 클래스
- `AIComparison`: AI 비교 분석 처리
- `UIController`: 사용자 인터페이스 관리

### 개발 시 주의사항
- 브라우저의 자동재생 정책 고려
- Web Audio API 컨텍스트 상태 관리
- 파일 크기 제한 (100MB)
- CORS 정책 준수

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 🆘 문제 해결

### 자주 발생하는 문제
1. **오디오 재생 안됨**: 브라우저 자동재생 차단 → 사용자 클릭 필요
2. **파일 업로드 실패**: 파일 크기 확인 (100MB 이하)
3. **마이크 접근 실패**: HTTPS 환경에서 실행 필요

### 지원 브라우저
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+ 