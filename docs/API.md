# PianoAI Coach - API 문서

## 개요

PianoAI Coach는 AI 기반 피아노 연주 분석 및 비교 도구입니다. 이 문서는 프로젝트의 주요 클래스와 메서드에 대한 API 참조를 제공합니다.

## 주요 클래스

### AudioAnalyzer

오디오 파일 분석을 담당하는 메인 클래스입니다.

#### 생성자
```javascript
const analyzer = new AudioAnalyzer();
```

#### 메서드

##### `initialize()`
오디오 컨텍스트를 초기화합니다.

```javascript
await analyzer.initialize();
```

**반환값:** `Promise<void>`

##### `analyzeFile(file)`
오디오 파일을 분석합니다.

```javascript
const analysis = await analyzer.analyzeFile(audioFile);
```

**매개변수:**
- `file` (File): 분석할 오디오 파일

**반환값:** `Promise<Object>`
```javascript
{
  tempo: number,           // BPM
  key: string,            // 음악적 키
  duration: number,       // 길이 (초)
  frequencyRange: string, // 주파수 범위
  pitchData: Array,       // 피치 데이터
  rhythmData: Array,      // 리듬 데이터
  timbreData: Array,      // 음색 데이터
  volumeData: Array       // 볼륨 데이터
}
```

##### `startRealTimeAnalysis(stream)`
실시간 오디오 분석을 시작합니다.

```javascript
analyzer.startRealTimeAnalysis(mediaStream);
```

**매개변수:**
- `stream` (MediaStream): 마이크 스트림

##### `stopRealTimeAnalysis()`
실시간 분석을 중지합니다.

```javascript
analyzer.stopRealTimeAnalysis();
```

##### `getFrequencyData()`
현재 주파수 데이터를 가져옵니다.

```javascript
const frequencyData = analyzer.getFrequencyData();
```

**반환값:** `Uint8Array`

##### `getTimeDomainData()`
현재 시간 도메인 데이터를 가져옵니다.

```javascript
const timeData = analyzer.getTimeDomainData();
```

**반환값:** `Uint8Array`

##### `dispose()`
리소스를 정리합니다.

```javascript
analyzer.dispose();
```

### AIComparison

AI 기반 비교 분석을 담당하는 클래스입니다.

#### 생성자
```javascript
const comparison = new AIComparison();
```

#### 메서드

##### `setOriginalAnalysis(analysis)`
원본 분석 결과를 설정합니다.

```javascript
comparison.setOriginalAnalysis(originalAnalysis);
```

**매개변수:**
- `analysis` (Object): 원본 분석 결과

##### `setRecordingAnalysis(analysis)`
연주 분석 결과를 설정합니다.

```javascript
comparison.setRecordingAnalysis(recordingAnalysis);
```

**매개변수:**
- `analysis` (Object): 연주 분석 결과

##### `compare(recordingAnalysis)`
비교 분석을 수행합니다.

```javascript
const results = await comparison.compare(recordingAnalysis);
```

**매개변수:**
- `recordingAnalysis` (Object): 연주 분석 결과

**반환값:** `Promise<Object>`
```javascript
{
  totalScore: number,           // 종합 점수
  pitchAccuracy: number,        // 음정 정확도
  rhythmAccuracy: number,       // 리듬 정확도
  timbreSimilarity: number,     // 음색 유사도
  pitchDetails: Object,         // 피치 상세 정보
  rhythmDetails: Object,        // 리듬 상세 정보
  timbreDetails: Object,        // 음색 상세 정보
  feedback: Object,             // 피드백
  grade: string,                // 등급
  timestamp: string             // 타임스탬프
}
```

##### `getResults()`
분석 결과를 가져옵니다.

```javascript
const results = comparison.getResults();
```

**반환값:** `Object|null`

##### `reset()`
분석 결과를 초기화합니다.

```javascript
comparison.reset();
```

### Utils

유틸리티 함수들을 제공하는 클래스입니다.

#### 정적 메서드

##### `formatFileSize(bytes)`
파일 크기를 사람이 읽기 쉬운 형태로 변환합니다.

```javascript
const size = Utils.formatFileSize(1024); // "1 KB"
```

**매개변수:**
- `bytes` (number): 바이트 단위 파일 크기

**반환값:** `string`

##### `formatDuration(seconds)`
초 단위 시간을 MM:SS 형태로 변환합니다.

```javascript
const duration = Utils.formatDuration(65); // "1:05"
```

**매개변수:**
- `seconds` (number): 초 단위 시간

**반환값:** `string`

##### `frequencyToNote(frequency)`
주파수를 음악적 음표로 변환합니다.

```javascript
const note = Utils.frequencyToNote(440); // "A4"
```

**매개변수:**
- `frequency` (number): 주파수 (Hz)

**반환값:** `string`

##### `noteToFrequency(note)`
음표를 주파수로 변환합니다.

```javascript
const frequency = Utils.noteToFrequency("A4"); // 440
```

**매개변수:**
- `note` (string): 음표 문자열

**반환값:** `number`

##### `bpmToTempo(bpm)`
BPM을 템포 정보로 변환합니다.

```javascript
const tempo = Utils.bpmToTempo(120);
// { bpm: 120, tempo: "Allegro", description: "빠르게" }
```

**매개변수:**
- `bpm` (number): 분당 비트 수

**반환값:** `Object`

##### `calculateRMS(audioData)`
오디오 데이터의 RMS를 계산합니다.

```javascript
const rms = Utils.calculateRMS(audioData);
```

**매개변수:**
- `audioData` (Float32Array): 오디오 데이터

**반환값:** `number`

##### `calculatePeak(audioData)`
오디오 데이터의 피크 값을 계산합니다.

```javascript
const peak = Utils.calculatePeak(audioData);
```

**매개변수:**
- `audioData` (Float32Array): 오디오 데이터

**반환값:** `number`

##### `amplitudeToDecibels(amplitude)`
진폭을 데시벨로 변환합니다.

```javascript
const db = Utils.amplitudeToDecibels(0.5);
```

**매개변수:**
- `amplitude` (number): 진폭 값 (0-1)

**반환값:** `number`

##### `decibelsToAmplitude(decibels)`
데시벨을 진폭으로 변환합니다.

```javascript
const amplitude = Utils.decibelsToAmplitude(-6);
```

**매개변수:**
- `decibels` (number): 데시벨 값

**반환값:** `number`

##### `calculateAverage(array)`
배열의 평균값을 계산합니다.

```javascript
const average = Utils.calculateAverage([1, 2, 3, 4, 5]); // 3
```

**매개변수:**
- `array` (Array): 숫자 배열

**반환값:** `number`

##### `calculateStandardDeviation(array)`
배열의 표준편차를 계산합니다.

```javascript
const std = Utils.calculateStandardDeviation([1, 2, 3, 4, 5]);
```

**매개변수:**
- `array` (Array): 숫자 배열

**반환값:** `number`

##### `calculateCorrelation(array1, array2)`
두 배열 간의 상관계수를 계산합니다.

```javascript
const correlation = Utils.calculateCorrelation(array1, array2);
```

**매개변수:**
- `array1` (Array): 첫 번째 배열
- `array2` (Array): 두 번째 배열

**반환값:** `number` (-1 ~ 1)

##### `calculateMedian(array)`
배열의 중앙값을 계산합니다.

```javascript
const median = Utils.calculateMedian([1, 3, 5, 7, 9]); // 5
```

**매개변수:**
- `array` (Array): 숫자 배열

**반환값:** `number`

##### `findMode(array)`
배열에서 최빈값을 찾습니다.

```javascript
const mode = Utils.findMode([1, 2, 2, 3, 4]); // 2
```

**매개변수:**
- `array` (Array): 배열

**반환값:** `*`

##### `getScoreColor(score)`
점수에 따른 색상을 반환합니다.

```javascript
const color = Utils.getScoreColor(85); // "#06b6d4"
```

**매개변수:**
- `score` (number): 점수 (0-100)

**반환값:** `string`

##### `getScoreGrade(score)`
점수에 따른 등급을 반환합니다.

```javascript
const grade = Utils.getScoreGrade(85); // "B+"
```

**매개변수:**
- `score` (number): 점수 (0-100)

**반환값:** `string`

##### `debounce(func, wait)`
디바운스 함수를 생성합니다.

```javascript
const debouncedFunc = Utils.debounce(myFunction, 300);
```

**매개변수:**
- `func` (Function): 실행할 함수
- `wait` (number): 대기 시간 (ms)

**반환값:** `Function`

##### `throttle(func, limit)`
쓰로틀 함수를 생성합니다.

```javascript
const throttledFunc = Utils.throttle(myFunction, 100);
```

**매개변수:**
- `func` (Function): 실행할 함수
- `limit` (number): 제한 시간 (ms)

**반환값:** `Function`

##### `showMessage(message, type)`
메시지를 표시합니다.

```javascript
Utils.showMessage("오류가 발생했습니다.", "error");
```

**매개변수:**
- `message` (string): 메시지
- `type` (string): 메시지 타입 ('error', 'warning', 'info', 'success')

##### `toggleLoading(element, show)`
로딩 상태를 표시/숨깁니다.

```javascript
Utils.toggleLoading(element, true);
```

**매개변수:**
- `element` (HTMLElement): 로딩을 표시할 요소
- `show` (boolean): 표시 여부

##### `isAllowedFileType(filename, allowedExtensions)`
파일 확장자를 확인합니다.

```javascript
const isAllowed = Utils.isAllowedFileType("audio.mp3", ["mp3", "wav"]);
```

**매개변수:**
- `filename` (string): 파일명
- `allowedExtensions` (Array): 허용된 확장자 배열

**반환값:** `boolean`

##### `isAllowedFileSize(fileSize, maxSize)`
파일 크기 제한을 확인합니다.

```javascript
const isAllowed = Utils.isAllowedFileSize(1024 * 1024, 10 * 1024 * 1024);
```

**매개변수:**
- `fileSize` (number): 파일 크기 (bytes)
- `maxSize` (number): 최대 크기 (bytes)

**반환값:** `boolean`

## 데이터 구조

### 분석 결과 구조

```javascript
{
  // 기본 정보
  tempo: number,           // BPM
  key: string,            // 음악적 키
  duration: number,       // 길이 (초)
  frequencyRange: string, // 주파수 범위
  
  // 상세 데이터
  pitchData: [
    {
      time: number,       // 시간 (초)
      frequency: number,  // 주파수 (Hz)
      note: string        // 음표
    }
  ],
  
  rhythmData: [
    {
      beatTime: number,   // 비트 시간 (초)
      interval: number,   // 비트 간격 (초)
      bpm: number         // 해당 구간 BPM
    }
  ],
  
  timbreData: [
    {
      time: number,       // 시간 (초)
      mfcc: Array         // MFCC 계수들
    }
  ],
  
  volumeData: [
    {
      time: number,       // 시간 (초)
      rms: number,        // RMS 값
      db: number          // 데시벨 값
    }
  ]
}
```

### 비교 결과 구조

```javascript
{
  // 점수
  totalScore: number,           // 종합 점수
  pitchAccuracy: number,        // 음정 정확도
  rhythmAccuracy: number,       // 리듬 정확도
  timbreSimilarity: number,     // 음색 유사도
  
  // 상세 정보
  pitchDetails: {
    score: number,
    accuracy: number,
    stability: number,
    pitchErrors: Array,
    details: string,
    issues: Array
  },
  
  rhythmDetails: {
    score: number,
    tempoAccuracy: number,
    beatAccuracy: number,
    patternSimilarity: number,
    details: string,
    issues: Array
  },
  
  timbreDetails: {
    score: number,
    mfccSimilarity: number,
    spectralSimilarity: number,
    harmonicSimilarity: number,
    details: string,
    issues: Array
  },
  
  // 피드백
  feedback: {
    overall: string,            // 전체 평가
    improvements: string,       // 개선점
    strengths: string,          // 장점
    specific: {
      pitch: string,
      rhythm: string,
      timbre: string
    }
  },
  
  // 메타데이터
  grade: string,                // 등급 (S+, S, A+, A, B+, B, C+, C, D, F)
  timestamp: string             // 타임스탬프
}
```

## 사용 예제

### 기본 사용법

```javascript
// 오디오 분석기 초기화
const analyzer = new AudioAnalyzer();
await analyzer.initialize();

// 파일 분석
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const analysis = await analyzer.analyzeFile(file);
  console.log('분석 결과:', analysis);
});

// AI 비교 분석
const comparison = new AIComparison();
comparison.setOriginalAnalysis(originalAnalysis);

const recordingAnalysis = await analyzer.analyzeFile(recordingFile);
const results = await comparison.compare(recordingAnalysis);
console.log('비교 결과:', results);
```

### 실시간 분석

```javascript
// 마이크 접근
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    analyzer.startRealTimeAnalysis(stream);
    
    // 주기적으로 데이터 수집
    setInterval(() => {
      const frequencyData = analyzer.getFrequencyData();
      const timeData = analyzer.getTimeDomainData();
      
      // 데이터 처리
      console.log('실시간 데이터:', { frequencyData, timeData });
    }, 100);
  })
  .catch(error => {
    console.error('마이크 접근 오류:', error);
  });
```

### 유틸리티 함수 사용

```javascript
// 파일 크기 포맷
const size = Utils.formatFileSize(1024 * 1024); // "1 MB"

// 시간 포맷
const duration = Utils.formatDuration(125); // "2:05"

// 주파수 변환
const note = Utils.frequencyToNote(440); // "A4"
const freq = Utils.noteToFrequency("C4"); // 261.63

// 점수 색상
const color = Utils.getScoreColor(85); // "#06b6d4"

// 등급
const grade = Utils.getScoreGrade(92); // "A"
```

## 브라우저 지원

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 제한사항

1. **파일 크기**: 최대 100MB
2. **지원 형식**: MP3, WAV, MP4, OGG
3. **마이크 접근**: HTTPS 환경에서만 가능
4. **자동재생**: 사용자 상호작용 후에만 가능

## 오류 처리

모든 메서드는 적절한 오류 처리를 포함합니다. 오류가 발생하면 `catch` 블록에서 처리하거나 `Utils.showMessage()`를 사용하여 사용자에게 알립니다.

```javascript
try {
  const analysis = await analyzer.analyzeFile(file);
  // 성공 처리
} catch (error) {
  console.error('분석 오류:', error);
  Utils.showMessage('파일 분석 중 오류가 발생했습니다.', 'error');
}
``` 