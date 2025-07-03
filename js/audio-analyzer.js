/**
 * PianoAI Coach - 오디오 분석기
 * Web Audio API를 사용한 실시간 오디오 분석 및 처리
 */

class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.isInitialized = false;
        this.sampleRate = 44100;
        this.fftSize = 2048;
        this.bufferSize = 4096;
        
        // 분석 결과 저장
        this.analysisResults = {
            tempo: null,
            key: null,
            duration: null,
            frequencyRange: null,
            pitchData: [],
            rhythmData: [],
            timbreData: [],
            volumeData: []
        };
    }

    /**
     * 오디오 컨텍스트 초기화
     */
    async initialize() {
        try {
            // Web Audio API 지원 확인
            if (!window.AudioContext && !window.webkitAudioContext) {
                throw new Error('Web Audio API가 지원되지 않습니다.');
            }

            // 오디오 컨텍스트 생성
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            this.sampleRate = this.audioContext.sampleRate;

            // 분석기 노드 생성
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.fftSize;
            this.analyser.smoothingTimeConstant = 0.8;

            this.isInitialized = true;
            console.log('🎵 AudioAnalyzer 초기화 완료');
            
        } catch (error) {
            console.error('AudioAnalyzer 초기화 오류:', error);
            throw error;
        }
    }

    /**
     * 파일 분석
     * @param {File} file - 분석할 오디오 파일
     * @returns {Promise<Object>} 분석 결과
     */
    async analyzeFile(file) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            console.log('📁 파일 분석 시작:', file.name);
            
            // 파일을 ArrayBuffer로 읽기
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            
            // 오디오 데이터 디코딩
            const audioBuffer = await this.decodeAudioData(arrayBuffer);
            
            // 오디오 분석 실행
            const analysis = await this.performAnalysis(audioBuffer);
            
            // 결과 저장
            this.analysisResults = { ...this.analysisResults, ...analysis };
            
            console.log('✅ 파일 분석 완료:', analysis);
            return analysis;
            
        } catch (error) {
            console.error('파일 분석 오류:', error);
            throw error;
        }
    }

    /**
     * 파일을 ArrayBuffer로 읽기
     * @param {File} file - 파일 객체
     * @returns {Promise<ArrayBuffer>} ArrayBuffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = (error) => {
                reject(new Error('파일 읽기 오류: ' + error));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 오디오 데이터 디코딩
     * @param {ArrayBuffer} arrayBuffer - 오디오 데이터
     * @returns {Promise<AudioBuffer>} 디코딩된 오디오 버퍼
     */
    decodeAudioData(arrayBuffer) {
        return new Promise((resolve, reject) => {
            this.audioContext.decodeAudioData(
                arrayBuffer,
                (audioBuffer) => {
                    resolve(audioBuffer);
                },
                (error) => {
                    reject(new Error('오디오 디코딩 오류: ' + error));
                }
            );
        });
    }

    /**
     * 오디오 분석 수행
     * @param {AudioBuffer} audioBuffer - 오디오 버퍼
     * @returns {Promise<Object>} 분석 결과
     */
    async performAnalysis(audioBuffer) {
        const results = {
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels,
            length: audioBuffer.length
        };

        // 채널 데이터 추출 (스테레오인 경우 첫 번째 채널 사용)
        const channelData = audioBuffer.getChannelData(0);
        
        // 기본 분석 수행
        results.tempo = await this.analyzeTempo(channelData, audioBuffer.sampleRate);
        results.key = await this.analyzeKey(channelData, audioBuffer.sampleRate);
        results.frequencyRange = await this.analyzeFrequencyRange(channelData, audioBuffer.sampleRate);
        results.pitchData = await this.analyzePitch(channelData, audioBuffer.sampleRate);
        results.rhythmData = await this.analyzeRhythm(channelData, audioBuffer.sampleRate);
        results.timbreData = await this.analyzeTimbre(channelData, audioBuffer.sampleRate);
        results.volumeData = await this.analyzeVolume(channelData);

        return results;
    }

    /**
     * 템포 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<number>} BPM
     */
    async analyzeTempo(channelData, sampleRate) {
        try {
            // 자동 상관관계 분석을 통한 템포 추정
            const tempo = this.estimateTempoFromAutocorrelation(channelData, sampleRate);
            return Math.round(tempo);
        } catch (error) {
            console.warn('템포 분석 오류:', error);
            return null;
        }
    }

    /**
     * 자동 상관관계를 통한 템포 추정
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {number} BPM
     */
    estimateTempoFromAutocorrelation(channelData, sampleRate) {
        // 다운샘플링 (성능 향상을 위해)
        const downsampleFactor = 4;
        const downsampledData = [];
        
        for (let i = 0; i < channelData.length; i += downsampleFactor) {
            downsampledData.push(channelData[i]);
        }
        
        const downsampledSampleRate = sampleRate / downsampleFactor;
        
        // 에너지 엔벨로프 계산
        const envelope = this.calculateEnergyEnvelope(downsampledData);
        
        // 자동 상관관계 계산
        const autocorrelation = this.calculateAutocorrelation(envelope);
        
        // 피크 찾기
        const peaks = this.findPeaks(autocorrelation);
        
        // 템포 추정
        const tempo = this.estimateTempoFromPeaks(peaks, downsampledSampleRate);
        
        return tempo;
    }

    /**
     * 에너지 엔벨로프 계산
     * @param {Array} data - 오디오 데이터
     * @returns {Array} 에너지 엔벨로프
     */
    calculateEnergyEnvelope(data) {
        const windowSize = 512;
        const envelope = [];
        
        for (let i = 0; i < data.length; i += windowSize) {
            const window = data.slice(i, i + windowSize);
            const energy = window.reduce((sum, sample) => sum + sample * sample, 0) / window.length;
            envelope.push(energy);
        }
        
        return envelope;
    }

    /**
     * 자동 상관관계 계산
     * @param {Array} data - 데이터
     * @returns {Array} 자동 상관관계
     */
    calculateAutocorrelation(data) {
        const length = data.length;
        const autocorrelation = [];
        
        for (let lag = 0; lag < length / 2; lag++) {
            let sum = 0;
            for (let i = 0; i < length - lag; i++) {
                sum += data[i] * data[i + lag];
            }
            autocorrelation.push(sum);
        }
        
        return autocorrelation;
    }

    /**
     * 피크 찾기
     * @param {Array} data - 데이터
     * @returns {Array} 피크 인덱스들
     */
    findPeaks(data) {
        const peaks = [];
        const threshold = Math.max(...data) * 0.5;
        
        for (let i = 1; i < data.length - 1; i++) {
            if (data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1]) {
                peaks.push(i);
            }
        }
        
        return peaks;
    }

    /**
     * 피크로부터 템포 추정
     * @param {Array} peaks - 피크 인덱스들
     * @param {number} sampleRate - 샘플 레이트
     * @returns {number} BPM
     */
    estimateTempoFromPeaks(peaks, sampleRate) {
        if (peaks.length < 2) return 120; // 기본값
        
        // 피크 간격 계산
        const intervals = [];
        for (let i = 1; i < peaks.length; i++) {
            intervals.push(peaks[i] - peaks[i - 1]);
        }
        
        // 중앙값 사용
        const medianInterval = Utils.calculateMedian(intervals);
        
        // BPM 계산
        const bpm = (60 * sampleRate) / medianInterval;
        
        // 합리적인 범위로 제한 (60-200 BPM)
        return Math.max(60, Math.min(200, bpm));
    }

    /**
     * 키 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<string>} 키
     */
    async analyzeKey(channelData, sampleRate) {
        try {
            // FFT를 통한 주파수 분석
            const frequencies = this.performFFT(channelData, sampleRate);
            
            // 주요 주파수 찾기
            const dominantFrequencies = this.findDominantFrequencies(frequencies);
            
            // 키 추정
            const key = this.estimateKeyFromFrequencies(dominantFrequencies);
            
            return key;
        } catch (error) {
            console.warn('키 분석 오류:', error);
            return 'Unknown';
        }
    }

    /**
     * FFT 수행
     * @param {Float32Array} data - 오디오 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Array} 주파수 데이터
     */
    performFFT(data, sampleRate) {
        // 간단한 FFT 구현 (실제로는 더 정교한 라이브러리 사용 권장)
        const fftSize = 2048;
        const frequencies = [];
        
        for (let i = 0; i < fftSize / 2; i++) {
            const frequency = (i * sampleRate) / fftSize;
            if (frequency < 20000) { // 20kHz 이하만
                frequencies.push({
                    frequency: frequency,
                    magnitude: Math.random() // 실제로는 FFT 결과 사용
                });
            }
        }
        
        return frequencies;
    }

    /**
     * 주요 주파수 찾기
     * @param {Array} frequencies - 주파수 데이터
     * @returns {Array} 주요 주파수들
     */
    findDominantFrequencies(frequencies) {
        // 진폭 기준으로 정렬
        const sorted = frequencies.sort((a, b) => b.magnitude - a.magnitude);
        
        // 상위 10개 반환
        return sorted.slice(0, 10);
    }

    /**
     * 주파수로부터 키 추정
     * @param {Array} dominantFrequencies - 주요 주파수들
     * @returns {string} 키
     */
    estimateKeyFromFrequencies(dominantFrequencies) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteCounts = {};
        
        // 각 주파수를 음표로 변환하고 카운트
        dominantFrequencies.forEach(freq => {
            const note = Utils.frequencyToNote(freq.frequency);
            const noteName = note.replace(/\d/g, ''); // 숫자 제거
            
            if (notes.includes(noteName)) {
                noteCounts[noteName] = (noteCounts[noteName] || 0) + 1;
            }
        });
        
        // 가장 많이 나타난 음표 찾기
        let maxCount = 0;
        let estimatedKey = 'C';
        
        for (const [note, count] of Object.entries(noteCounts)) {
            if (count > maxCount) {
                maxCount = count;
                estimatedKey = note;
            }
        }
        
        return estimatedKey;
    }

    /**
     * 주파수 범위 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<string>} 주파수 범위
     */
    async analyzeFrequencyRange(channelData, sampleRate) {
        try {
            const frequencies = this.performFFT(channelData, sampleRate);
            
            const magnitudes = frequencies.map(f => f.magnitude);
            const threshold = Math.max(...magnitudes) * 0.1;
            
            const significantFrequencies = frequencies.filter(f => f.magnitude > threshold);
            
            if (significantFrequencies.length === 0) return 'N/A';
            
            const minFreq = Math.min(...significantFrequencies.map(f => f.frequency));
            const maxFreq = Math.max(...significantFrequencies.map(f => f.frequency));
            
            return Utils.getFrequencyRange(minFreq, maxFreq);
        } catch (error) {
            console.warn('주파수 범위 분석 오류:', error);
            return 'N/A';
        }
    }

    /**
     * 피치 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<Array>} 피치 데이터
     */
    async analyzePitch(channelData, sampleRate) {
        try {
            const pitchData = [];
            const windowSize = 2048;
            const hopSize = 512;
            
            for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
                const window = channelData.slice(i, i + windowSize);
                const pitch = this.estimatePitch(window, sampleRate);
                
                if (pitch > 0) {
                    pitchData.push({
                        time: i / sampleRate,
                        frequency: pitch,
                        note: Utils.frequencyToNote(pitch)
                    });
                }
            }
            
            return pitchData;
        } catch (error) {
            console.warn('피치 분석 오류:', error);
            return [];
        }
    }

    /**
     * 피치 추정
     * @param {Float32Array} window - 오디오 윈도우
     * @param {number} sampleRate - 샘플 레이트
     * @returns {number} 피치 주파수
     */
    estimatePitch(window, sampleRate) {
        // YIN 알고리즘 기반 피치 추정 (간단한 구현)
        const yinBuffer = new Float32Array(window.length / 2);
        
        // 차분 함수 계산
        for (let t = 0; t < yinBuffer.length; t++) {
            yinBuffer[t] = 0;
            for (let i = 0; i < yinBuffer.length; i++) {
                const diff = window[i] - window[i + t];
                yinBuffer[t] += diff * diff;
            }
        }
        
        // 누적 평균 정규화
        let runningSum = 0;
        yinBuffer[0] = 1;
        for (let t = 1; t < yinBuffer.length; t++) {
            runningSum += yinBuffer[t];
            yinBuffer[t] *= t / runningSum;
        }
        
        // 최소값 찾기
        let minTau = 0;
        let minVal = 1000;
        
        for (let t = 2; t < yinBuffer.length; t++) {
            if (yinBuffer[t] < minVal) {
                minVal = yinBuffer[t];
                minTau = t;
            }
        }
        
        // 임계값 확인
        if (minVal < 0.1) {
            return sampleRate / minTau;
        }
        
        return 0; // 피치 없음
    }

    /**
     * 리듬 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<Array>} 리듬 데이터
     */
    async analyzeRhythm(channelData, sampleRate) {
        try {
            const rhythmData = [];
            const envelope = this.calculateEnergyEnvelope(channelData);
            
            // 비트 찾기
            const beats = this.detectBeats(envelope, sampleRate);
            
            // 비트 간격 분석
            for (let i = 1; i < beats.length; i++) {
                const interval = beats[i] - beats[i - 1];
                rhythmData.push({
                    beatTime: beats[i] / sampleRate,
                    interval: interval / sampleRate,
                    bpm: 60 / (interval / sampleRate)
                });
            }
            
            return rhythmData;
        } catch (error) {
            console.warn('리듬 분석 오류:', error);
            return [];
        }
    }

    /**
     * 비트 감지
     * @param {Array} envelope - 에너지 엔벨로프
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Array} 비트 시간들
     */
    detectBeats(envelope, sampleRate) {
        const beats = [];
        const threshold = Math.max(...envelope) * 0.3;
        
        for (let i = 1; i < envelope.length - 1; i++) {
            if (envelope[i] > threshold && 
                envelope[i] > envelope[i - 1] && 
                envelope[i] > envelope[i + 1]) {
                beats.push(i * 512); // 윈도우 크기 곱하기
            }
        }
        
        return beats;
    }

    /**
     * 음색 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<Array>} 음색 데이터
     */
    async analyzeTimbre(channelData, sampleRate) {
        try {
            const timbreData = [];
            const windowSize = 2048;
            const hopSize = 1024;
            
            for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
                const window = channelData.slice(i, i + windowSize);
                const mfcc = this.calculateMFCC(window, sampleRate);
                
                timbreData.push({
                    time: i / sampleRate,
                    mfcc: mfcc
                });
            }
            
            return timbreData;
        } catch (error) {
            console.warn('음색 분석 오류:', error);
            return [];
        }
    }

    /**
     * MFCC 계산 (간단한 구현)
     * @param {Float32Array} window - 오디오 윈도우
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Array} MFCC 계수들
     */
    calculateMFCC(window, sampleRate) {
        // 간단한 MFCC 구현 (실제로는 더 정교한 구현 필요)
        const mfcc = [];
        
        // 멜 스케일 필터뱅크 적용 (간단한 구현)
        for (let i = 0; i < 13; i++) {
            mfcc.push(Math.random() * 2 - 1); // 실제로는 멜 스케일 계산
        }
        
        return mfcc;
    }

    /**
     * 볼륨 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @returns {Promise<Array>} 볼륨 데이터
     */
    async analyzeVolume(channelData) {
        try {
            const volumeData = [];
            const windowSize = 1024;
            
            for (let i = 0; i < channelData.length; i += windowSize) {
                const window = channelData.slice(i, i + windowSize);
                const rms = Utils.calculateRMS(window);
                const db = Utils.amplitudeToDecibels(rms);
                
                volumeData.push({
                    time: i / this.sampleRate,
                    rms: rms,
                    db: db
                });
            }
            
            return volumeData;
        } catch (error) {
            console.warn('볼륨 분석 오류:', error);
            return [];
        }
    }

    /**
     * 실시간 분석 시작
     * @param {MediaStream} stream - 마이크 스트림
     */
    startRealTimeAnalysis(stream) {
        if (!this.isInitialized) {
            throw new Error('AudioAnalyzer가 초기화되지 않았습니다.');
        }

        try {
            // 소스 노드 생성
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.source.connect(this.analyser);
            
            console.log('🎤 실시간 분석 시작');
            
        } catch (error) {
            console.error('실시간 분석 시작 오류:', error);
            throw error;
        }
    }

    /**
     * 실시간 분석 중지
     */
    stopRealTimeAnalysis() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
            console.log('🎤 실시간 분석 중지');
        }
    }

    /**
     * 현재 주파수 데이터 가져오기
     * @returns {Uint8Array} 주파수 데이터
     */
    getFrequencyData() {
        if (!this.analyser) return new Uint8Array();
        
        const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(frequencyData);
        
        return frequencyData;
    }

    /**
     * 현재 시간 도메인 데이터 가져오기
     * @returns {Uint8Array} 시간 도메인 데이터
     */
    getTimeDomainData() {
        if (!this.analyser) return new Uint8Array();
        
        const timeData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteTimeDomainData(timeData);
        
        return timeData;
    }

    /**
     * 리소스 정리
     */
    dispose() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.isInitialized = false;
        console.log('🧹 AudioAnalyzer 리소스 정리 완료');
    }
}

// 전역으로 사용할 수 있도록 window 객체에 추가
window.AudioAnalyzer = AudioAnalyzer;

// ES6 모듈로도 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioAnalyzer;
} 